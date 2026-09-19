import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.PORT || 8787);
const dataDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const clients = new Set();

const seedDrivers = [
  { id: 'driver-aarav', name: 'Aarav Sharma', rating: '4.9', car: 'Toyota Innova', eta: '3 min', distance: '0.8 km', color: 'driver-green', lat: 28.6139, lng: 77.2090 },
  { id: 'driver-zoya', name: 'Zoya Khan', rating: '4.8', car: 'Honda City', eta: '5 min', distance: '1.4 km', color: 'driver-orange', lat: 28.6200, lng: 77.2150 },
  { id: 'driver-kabir', name: 'Kabir Mehta', rating: '4.9', car: 'Maruti Suzuki XL6', eta: '8 min', distance: '2.1 km', color: 'driver-blue', lat: 28.6070, lng: 77.2020 },
];

function distanceInKm(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371;
  const latitudeDelta = (lat2 - lat1) * Math.PI / 180;
  const longitudeDelta = (lng2 - lng1) * Math.PI / 180;
  const area = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(area), Math.sqrt(1 - area));
}

async function readCollection(name) {
  try {
    return JSON.parse(await readFile(path.join(dataDirectory, name), 'utf8'));
  } catch {
    return [];
  }
}

async function addRecord(name, record) {
  await mkdir(dataDirectory, { recursive: true });
  const records = await readCollection(name);
  records.push(record);
  await writeFile(path.join(dataDirectory, name), JSON.stringify(records, null, 2));
  return record;
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  response.end(JSON.stringify(payload));
}

function broadcast(type, payload) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => client.write(message));
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) body += chunk;
  if (body.length > 100_000) throw new Error('Payload too large');
  return body ? JSON.parse(body) : {};
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const method = request.method;

  if (method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    });
    response.end();
    return;
  }

  if (method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'milewise-api', time: new Date().toISOString() });
    return;
  }

  if (method === 'GET' && url.pathname === '/api/drivers') {
    const riderLat = Number(url.searchParams.get('lat'));
    const riderLng = Number(url.searchParams.get('lng'));
    const drivers = Number.isFinite(riderLat) && Number.isFinite(riderLng)
      ? seedDrivers.map((driver) => {
        const distance = distanceInKm(riderLat, riderLng, driver.lat, driver.lng);
        return { ...driver, distance: `${distance.toFixed(1)} km`, eta: `${Math.max(3, Math.round(distance * 4))} min` };
      }).sort((first, second) => Number.parseFloat(first.distance) - Number.parseFloat(second.distance))
      : seedDrivers;
    sendJson(response, 200, drivers);
    return;
  }

  if (method === 'GET' && url.pathname === '/api/events') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    response.write(`event: ready\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
    clients.add(response);
    request.on('close', () => clients.delete(response));
    return;
  }

  if (method === 'POST') {
    try {
      const body = await readBody(request);
      const record = { id: randomUUID(), createdAt: new Date().toISOString(), ...body };

      if (url.pathname === '/api/rides') {
        const saved = await addRecord('rides.json', record);
        broadcast('ride.created', saved);
        sendJson(response, 201, saved);
        return;
      }

      if (url.pathname === '/api/driver-applications') {
        const saved = await addRecord('driver-applications.json', record);
        broadcast('driver.application.created', saved);
        sendJson(response, 201, saved);
        return;
      }

      if (url.pathname === '/api/location') {
        const locations = await readCollection('locations.json');
        const nextLocations = locations.filter((location) => location.userId !== body.userId);
        nextLocations.push(record);
        await mkdir(dataDirectory, { recursive: true });
        await writeFile(path.join(dataDirectory, 'locations.json'), JSON.stringify(nextLocations, null, 2));
        broadcast('location.updated', record);
        sendJson(response, 200, record);
        return;
      }
    } catch (error) {
      sendJson(response, 400, { error: error.message });
      return;
    }
  }

  sendJson(response, 404, { error: 'Route not found' });
});

setInterval(() => {
  clients.forEach((client) => client.write(': keep-alive\n\n'));
}, 20_000);

server.listen(port, () => {
  console.log(`Milewise API running at http://localhost:${port}`);
});
