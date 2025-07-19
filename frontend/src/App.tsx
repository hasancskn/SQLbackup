import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Button, Select, MenuItem, TextField, Paper, Snackbar, Alert, InputAdornment, IconButton, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Switch, Tabs, Tab } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import api from './api';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import Migration from './Migration';

interface DatabaseOption {
  name: string;
  command: string;
  defaultPort: number;
}

const dbDefaults: Record<string, { port: number }> = {
  MySQL: { port: 3306 },
  PostgreSQL: { port: 5432 },
  MSSQL: { port: 1433 },
  MongoDB: { port: 27017 },
};

const scheduleOptions = [
  { label: 'Manuel', value: 'manual' },
  { label: 'Her Saat', value: 'hourly' },
  { label: 'Her Gün', value: 'daily' },
  { label: 'Her Hafta', value: 'weekly' },
  { label: 'Gelişmiş (cron)', value: 'custom' },
];

const App: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>('');
  const [selectedCommand, setSelectedCommand] = useState<string>('');
  const [jobName, setJobName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState<number | ''>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dbName, setDbName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [schedule, setSchedule] = useState('manual');
  const [customCron, setCustomCron] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success'|'error'}>({open: false, message: '', severity: 'success'});
  const [jobs, setJobs] = useState<any[]>([]);
  const [editId, setEditId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyJob, setHistoryJob] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [runLoading, setRunLoading] = useState<number|null>(null);
  const [tab, setTab] = useState(0);
  const theme = useTheme();

  const fetchJobs = () => {
    api.get('/jobs').then(res => setJobs(res.data));
  };

  useEffect(() => {
    api.get('/databases')
      .then(res => setDatabases(res.data.map((db: any) => ({ ...db, defaultPort: dbDefaults[db.name]?.port || '' }))))
      .catch(() => setSnackbar({open: true, message: 'Veritabanı listesi alınamadı', severity: 'error'}));
    fetchJobs();
  }, []);

  const handleDbChange = (e: any) => {
    const db = databases.find(d => d.name === e.target.value);
    setSelectedDb(e.target.value);
    setSelectedCommand(db ? db.command : '');
    setPort(db ? db.defaultPort : '');
  };

  const handleAddJob = async () => {
    if (!selectedDb || !jobName || !host || !port || !username || !password || !dbName) {
      setSnackbar({open: true, message: 'Lütfen tüm alanları doldurun', severity: 'error'});
      return;
    }
    let finalSchedule = schedule;
    if (schedule === 'custom') {
      if (!customCron) {
        setSnackbar({open: true, message: 'Cron ifadesi girin', severity: 'error'});
        return;
      }
      finalSchedule = customCron;
    }
    try {
      if (editId) {
        await api.put(`/jobs/${editId}`, {
          name: jobName,
          db_type: selectedDb,
          host,
          port,
          username,
          password,
          db_name: dbName,
          schedule: finalSchedule
        });
        setSnackbar({open: true, message: 'Job güncellendi', severity: 'success'});
        setEditId(null);
      } else {
        await api.post('/jobs', {
          name: jobName,
          db_type: selectedDb,
          host,
          port,
          username,
          password,
          db_name: dbName,
          schedule: finalSchedule
        });
        setSnackbar({open: true, message: 'Job başarıyla eklendi', severity: 'success'});
      }
      setJobName(''); setHost(''); setPort(''); setUsername(''); setPassword(''); setDbName(''); setSchedule('manual'); setCustomCron('');
      fetchJobs();
    } catch {
      setSnackbar({open: true, message: 'Job eklenemedi', severity: 'error'});
    }
  };

  const handleEdit = (job: any) => {
    setEditId(job.id);
    setJobName(job.name);
    setSelectedDb(job.db_type);
    setHost(job.host);
    setPort(job.port);
    setUsername(job.username);
    setPassword(job.password);
    setDbName(job.db_name);
    if (["manual","hourly","daily","weekly"].includes(job.schedule)) {
      setSchedule(job.schedule);
      setCustomCron('');
    } else {
      setSchedule('custom');
      setCustomCron(job.schedule);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/jobs/${id}`);
    fetchJobs();
    setSnackbar({open: true, message: 'Job silindi', severity: 'success'});
  };

  const handleToggleActive = async (job: any) => {
    await api.patch(`/jobs/${job.id}/toggle`);
    fetchJobs();
  };

  const handleRunNow = async (job: any) => {
    setRunLoading(job.id);
    try {
      await api.post(`/jobs/${job.id}/run`);
      setSnackbar({open: true, message: 'Job çalıştırıldı', severity: 'success'});
      fetchJobs();
    } catch {
      setSnackbar({open: true, message: 'Çalıştırma hatası', severity: 'error'});
    }
    setRunLoading(null);
  };

  const handleShowHistory = async (job: any) => {
    setHistoryJob(job);
    setHistoryOpen(true);
    const res = await api.get(`/jobs/${job.id}/backups`);
    setBackups(res.data);
  };

  const handleCloseHistory = () => {
    setHistoryOpen(false);
    setHistoryJob(null);
    setBackups([]);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Ad', flex: 1 },
    { field: 'db_type', headerName: 'Veritabanı', flex: 1 },
    { field: 'host', headerName: 'Host', flex: 1 },
    { field: 'port', headerName: 'Port', flex: 0.7 },
    { field: 'schedule', headerName: 'Aralık', flex: 1 },
    {
      field: 'is_active',
      headerName: 'Aktif',
      flex: 0.7,
      renderCell: (params) => (
        <Switch checked={!!params.row.is_active} onChange={() => handleToggleActive(params.row)} color="primary" />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'İşlemler',
      getActions: (params) => [
        <GridActionsCellItem icon={<PlayArrowIcon />} label="Çalıştır" onClick={() => handleRunNow(params.row)} disabled={runLoading === params.row.id} showInMenu={false} />,
        <GridActionsCellItem icon={<HistoryIcon />} label="Geçmiş" onClick={() => handleShowHistory(params.row)} showInMenu={false} />,
        <GridActionsCellItem icon={<EditIcon />} label="Düzenle" onClick={() => handleEdit(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Sil" onClick={() => setDeleteId(params.row.id)} />
      ],
      flex: 1.2,
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/jobs/${deleteId}`);
      fetchJobs();
      setSnackbar({open: true, message: 'Job silindi', severity: 'success'});
    } catch {
      setSnackbar({open: true, message: 'Job silinemedi', severity: 'error'});
    }
    setDeleteLoading(false);
    setDeleteId(null);
  };

  return (
    <>
      <Box sx={{ width: '100%', bgcolor: '#f4f6fa', display: 'flex', justifyContent: 'center', pt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label="Job Yönetimi" />
          <Tab label="Migration" />
        </Tabs>
      </Box>
      {tab === 0 ? (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', py: 6 }}>
          <Paper elevation={6} sx={{ width: '100%', maxWidth: 500, p: 5, mb: 5, borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.15)' }}>
            <Typography variant="h3" fontWeight={700} color="primary" gutterBottom align="center" sx={{ letterSpacing: 1 }}>SQLBackup</Typography>
            <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>Veritabanı yedekleme job'larınızı kolayca yönetin</Typography>
            {editId && <Button sx={{ mb: 2 }} onClick={() => { setEditId(null); setJobName(''); setHost(''); setPort(''); setUsername(''); setPassword(''); setDbName(''); setSchedule('manual'); setCustomCron(''); }}>Vazgeç</Button>}
            <Box sx={{ mb: 2 }}>
              <Select
                fullWidth
                value={selectedDb}
                onChange={handleDbChange}
                displayEmpty
              >
                <MenuItem value=""><em>Veritabanı Seçin</em></MenuItem>
                {databases.map(db => (
                  <MenuItem key={db.name} value={db.name}>{db.name}</MenuItem>
                ))}
              </Select>
            </Box>
            {selectedCommand && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Backup Komutu:</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', fontFamily: 'monospace', fontSize: 14 }}>
                  {selectedCommand}
                </Paper>
              </Box>
            )}
            {selectedDb && (
              <>
                <TextField fullWidth label="Job Adı" value={jobName} onChange={e => setJobName(e.target.value)} sx={{ mb: 2 }} />
                <TextField fullWidth label="Host/IP" value={host} onChange={e => setHost(e.target.value)} sx={{ mb: 2 }} />
                <TextField fullWidth label="Port" type="number" value={port} onChange={e => setPort(Number(e.target.value))} sx={{ mb: 2 }} />
                <TextField fullWidth label="Kullanıcı Adı" value={username} onChange={e => setUsername(e.target.value)} sx={{ mb: 2 }} />
                <TextField
                  fullWidth
                  label="Şifre"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField fullWidth label="Veritabanı Adı" value={dbName} onChange={e => setDbName(e.target.value)} sx={{ mb: 2 }} />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="schedule-label">Çalışma Aralığı</InputLabel>
                  <Select
                    labelId="schedule-label"
                    value={schedule}
                    label="Çalışma Aralığı"
                    onChange={e => setSchedule(e.target.value)}
                  >
                    {scheduleOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {schedule === 'custom' && (
                  <TextField fullWidth label="Cron İfadesi" value={customCron} onChange={e => setCustomCron(e.target.value)} sx={{ mb: 2 }} />
                )}
              </>
            )}
            <Button variant="contained" color="primary" fullWidth onClick={handleAddJob} sx={{ mt: 2 }}>
              Job Oluştur
            </Button>
          </Paper>
          <Paper elevation={4} sx={{ width: '100%', maxWidth: 900, p: 3, borderRadius: 4, boxShadow: '0 8px 32px 0 rgba(31,38,135,0.10)' }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>Kayıtlı Joblar</Typography>
            <DataGrid
              autoHeight
              rows={jobs}
              columns={columns}
              pagination
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              getRowId={row => row.id}
              sx={{ bgcolor: 'background.paper', borderRadius: 2, '& .MuiDataGrid-row:hover': { bgcolor: '#e3f2fd' } }}
            />
          </Paper>
          <Dialog open={historyOpen} onClose={handleCloseHistory} maxWidth="md" fullWidth>
            <DialogTitle>{historyJob?.name} - Backup Geçmişi</DialogTitle>
            <DialogContent>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Dosya</TableCell>
                      <TableCell>Hata</TableCell>
                      <TableCell>İndir</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {backups.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{new Date(b.created_at).toLocaleString()}</TableCell>
                        <TableCell>{b.success ? 'Başarılı' : 'Hata'}</TableCell>
                        <TableCell>{b.file_path ? b.file_path.split('/').pop() : '-'}</TableCell>
                        <TableCell>{b.error_message || '-'}</TableCell>
                        <TableCell>
                          {b.file_path && b.success ? (
                            <Button size="small" href={`http://localhost:8000/backups/${b.id}/download`} target="_blank">İndir</Button>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseHistory}>Kapat</Button>
            </DialogActions>
          </Dialog>
          <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
            <DialogTitle>Job Sil</DialogTitle>
            <DialogContent>
              <DialogContentText>Bu job'ı silmek istediğinize emin misiniz?</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteId(null)} disabled={deleteLoading}>Vazgeç</Button>
              <Button onClick={handleDeleteConfirm} color="error" disabled={deleteLoading}>Sil</Button>
            </DialogActions>
          </Dialog>
          <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({...snackbar, open: false})}>
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </Box>
      ) : (
        <Migration />
      )}
    </>
  );
};

export default App; 