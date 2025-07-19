import React, { useState } from 'react';
import { Box, Paper, Typography, Select, MenuItem, TextField, Button, Grid, Alert, CircularProgress } from '@mui/material';
import api from './api';

const defaultConn = { type: '', host: '', port: '', user: '', password: '', db_name: '' };

const migrationMatrix: Record<string, string[]> = {
  'MySQL': ['PostgreSQL', 'MariaDB'],
  'MariaDB': ['MySQL', 'MariaDB'],
  'PostgreSQL': ['PostgreSQL', 'MySQL'],
  'SQLite': ['SQLite', 'PostgreSQL'],
  'Oracle': ['PostgreSQL'],
  'MSSQL': ['PostgreSQL'],
  'MongoDB': ['PostgreSQL'],
  'Elasticsearch': ['Elasticsearch'],
};

const Migration: React.FC = () => {
  const [source, setSource] = useState({ ...defaultConn });
  const [target, setTarget] = useState({ ...defaultConn });
  const [result, setResult] = useState<{command: string, info: string, output: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (which: 'source'|'target', field: string, value: string) => {
    if (which === 'source') setSource(s => ({ ...s, [field]: value }));
    else setTarget(t => ({ ...t, [field]: value }));
  };

  const handleMigrate = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/migrate', { source, target });
      setResult(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Migration işlemi sırasında hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fa', display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
      <Paper elevation={6} sx={{ width: '100%', maxWidth: 700, p: 5, borderRadius: 4, mb: 4 }}>
        <Typography variant="h4" fontWeight={700} color="primary" gutterBottom align="center">Veritabanı Migration</Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>Farklı veritabanları arasında kolayca veri taşıyın</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>Kaynak (Import Alınan) Veritabanı</Typography>
            <Select fullWidth value={source.type} onChange={e => handleChange('source', 'type', e.target.value)} displayEmpty sx={{ mb: 2 }}>
              <MenuItem value=""><em>Veritabanı Seçin</em></MenuItem>
              {Object.keys(migrationMatrix).map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
            <TextField fullWidth label="Host/IP" value={source.host} onChange={e => handleChange('source', 'host', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Port" value={source.port} onChange={e => handleChange('source', 'port', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Kullanıcı Adı" value={source.user} onChange={e => handleChange('source', 'user', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Şifre" type="password" value={source.password} onChange={e => handleChange('source', 'password', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Veritabanı Adı" value={source.db_name} onChange={e => handleChange('source', 'db_name', e.target.value)} sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography fontWeight={600} sx={{ mb: 1 }}>Hedef (Migration Yapılacak) Veritabanı</Typography>
            <Select fullWidth value={target.type} onChange={e => handleChange('target', 'type', e.target.value)} displayEmpty sx={{ mb: 2 }} disabled={!source.type}>
              <MenuItem value=""><em>Veritabanı Seçin</em></MenuItem>
              {(migrationMatrix[source.type] || []).filter(t => t !== source.type).map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
            <TextField fullWidth label="Host/IP" value={target.host} onChange={e => handleChange('target', 'host', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Port" value={target.port} onChange={e => handleChange('target', 'port', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Kullanıcı Adı" value={target.user} onChange={e => handleChange('target', 'user', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Şifre" type="password" value={target.password} onChange={e => handleChange('target', 'password', e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth label="Veritabanı Adı" value={target.db_name} onChange={e => handleChange('target', 'db_name', e.target.value)} sx={{ mb: 2 }} />
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" color="primary" size="large" onClick={handleMigrate} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Migrate'}
          </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
        {result && (
          <Paper sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="subtitle1" fontWeight={600}>Önerilen Komut:</Typography>
            <Typography sx={{ fontFamily: 'monospace', mb: 2 }}>{result.command || '-'}</Typography>
            <Typography color="text.secondary">{result.info}</Typography>
            <Typography sx={{ mt: 2, whiteSpace: 'pre-line' }}>{result.output}</Typography>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};

export default Migration; 