import fetch from 'node-fetch';

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImV4cCI6MTc4Mzk0NDkxNX0.TEPDDVm_QRyAIge4dgwyh_O1oKDTZVoI6JOMit5OQHw';
const urls = ['http://localhost:3000/api/soporte/ficha?reportes=1', 'http://localhost:3000/api/soporte/baja?reportes=1'];

for (const url of urls) {
  const res = await fetch(url, {
    headers: {
      Cookie: `auth_token=${token}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  console.log('URL:', url);
  console.log('STATUS:', res.status);
  console.log('CONTENT-TYPE:', res.headers.get('content-type'));
  console.log('BODY:\n', text);
  console.log('\n----\n');
}
