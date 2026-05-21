import request from 'supertest';
import { createApp } from './src/app';

const app = createApp();

async function runTests() {
  console.log('--- Testing GET /api/invite-codes ---');
  try {
    const getRes = await request(app).get('/api/invite-codes');
    console.log('Status:', getRes.status);
    console.log('Body:', JSON.stringify(getRes.body, null, 2));
  } catch (err) {
    console.error('Error in GET:', err);
  }

  console.log('\n--- Testing POST /api/invite-codes ---');
  try {
    const postRes = await request(app).post('/api/invite-codes').send({});
    console.log('Status:', postRes.status);
    console.log('Body:', JSON.stringify(postRes.body, null, 2));
  } catch (err) {
    console.error('Error in POST:', err);
  }
}

runTests();
