import { useEffect, useRef, useState } from 'react';
import './styles.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>;
}

const nearbyDrivers = [
  { name: 'Aarav Sharma', rating: '4.9', car: 'Toyota Innova', eta: '3 min', distance: '0.8 km', color: 'driver-green' },
  { name: 'Zoya Khan', rating: '4.8', car: 'Honda City', eta: '5 min', distance: '1.4 km', color: 'driver-orange' },
  { name: 'Kabir Mehta', rating: '4.9', car: 'Maruti Suzuki XL6', eta: '8 min', distance: '2.1 km', color: 'driver-blue' },
];

function RideFinder({ notify }) {
  const [address, setAddress] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [matchedLocation, setMatchedLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [drivers, setDrivers] = useState(nearbyDrivers);
  const watchId = useRef(null);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  async function sendLocation(nextCoordinates) {
    try {
      await fetch(`${API_BASE}/api/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', role: 'rider', ...nextCoordinates }),
      });
    } catch {
      // The static GitHub Pages build still works without a local API.
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not available. Enter your address instead.');
      return;
    }

    setLocationStatus('Finding your location...');
    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextCoordinates = { lat: coords.latitude, lng: coords.longitude };
        setCoordinates(nextCoordinates);
        setAddress(`Current location (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`);
        setLocationStatus('Location sharing is on');
        sendLocation(nextCoordinates);
      },
      () => setLocationStatus('We could not access your location. Enter it manually.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
  }

  async function findDrivers(event) {
    event.preventDefault();
    if (!address.trim()) {
      setLocationStatus('Add an address or use your current location first.');
      return;
    }
    try {
      const params = new URLSearchParams(coordinates || {});
      const response = await fetch(`${API_BASE}/api/drivers?${params}`);
      if (response.ok) setDrivers(await response.json());
      await fetch(`${API_BASE}/api/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'guest-user', pickup: address.trim(), coordinates }),
      });
    } catch {
      setDrivers(nearbyDrivers);
    }
    setMatchedLocation(address.trim());
    notify('Nearest drivers found. Pick the ride that works for you.');
  }

  return (
    <div className="ride-finder-wrap">
      <form className="booking-card ride-finder" onSubmit={findDrivers}>
        <div className="card-heading">
          <div>
            <h2>Find your ride</h2>
            <p>Drivers nearby, ready when you are</p>
          </div>
          <span className="card-badge">Live matching</span>
        </div>
        <div className="location-field field">
          <span className="field-icon">⌖</span>
          <div>
            <label htmlFor="address">Pick-up address</label>
            <input id="address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search your address" />
          </div>
        </div>
        <button className="location-button" type="button" onClick={useCurrentLocation}><span>◎</span> Use my current location</button>
        {locationStatus && <p className="location-status" role="status">{locationStatus}</p>}
        <button className="find-button" type="submit">Show nearest drivers <span>→</span></button>
        <p className="form-note">Your location is only used to find nearby rides.</p>
      </form>
      {matchedLocation && <DriverMatches location={matchedLocation} drivers={drivers} notify={notify} />}
    </div>
  );
}

function DriverMatches({ location, drivers, notify }) {
  return (
    <section className="matches-panel" aria-live="polite">
      <div className="matches-header"><div><span className="live-dot" /> Drivers near you</div><span className="matches-location">⌖ {location}</span></div>
      <div className="driver-list">
        {drivers.map((driver) => (
          <article className="driver-result" key={driver.name}>
            <div className={`driver-avatar ${driver.color}`}>{driver.name.split(' ').map((part) => part[0]).join('')}</div>
            <div className="driver-info"><h3>{driver.name} <span>★ {driver.rating}</span></h3><p>{driver.car} · {driver.distance} away</p></div>
            <div className="driver-action"><strong>{driver.eta}</strong><button type="button" onClick={() => notify(`${driver.name} is ready for your trip.`)}>Choose</button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DriverCard({ notify }) {
  const [form, setForm] = useState({
    city: '',
    vehicle: '',
    availability: 'Weekdays',
  });

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submitBooking(event) {
    event.preventDefault();
    try {
      await fetch(`${API_BASE}/api/driver-applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {
      // Keep the form useful when the frontend is hosted without the API.
    }
    notify(`Thanks. We will connect you with customers in ${form.city || 'your area'}.`);
  }

  return (
    <form className="booking-card driver-card" onSubmit={submitBooking}>
      <div className="card-heading">
        <div>
          <h2>Start driving</h2>
          <p>Turn your car into a livelihood</p>
        </div>
        <span className="card-badge">Free to join</span>
      </div>

      <div className="route-fields">
        <div className="field">
          <span className="field-icon">⌖</span>
          <div>
            <label htmlFor="city">Your city</label>
            <input id="city" name="city" value={form.city} onChange={updateField} required placeholder="Where do you drive?" />
          </div>
        </div>
        <div className="field">
          <span className="field-icon">▰</span>
          <div>
            <label htmlFor="vehicle">Your vehicle</label>
            <input id="vehicle" name="vehicle" value={form.vehicle} onChange={updateField} required placeholder="Make and model" />
          </div>
        </div>
        <div className="field">
          <span className="field-icon">◷</span>
          <div>
            <label htmlFor="availability">When can you drive?</label>
            <select id="availability" name="availability" value={form.availability} onChange={updateField}>
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>Whenever I am free</option>
            </select>
          </div>
        </div>
      </div>

      <button className="find-button" type="submit">Apply to drive <span>→</span></button>
      <p className="form-note">No sign-up fee. You choose when to work.</p>
    </form>
  );
}

export default function App() {
  const [toast, setToast] = useState('');

  useEffect(() => {
    let events;
    try {
      events = new EventSource(`${API_BASE}/api/events`);
      events.addEventListener('ride.created', () => notify('A new ride request was added to the live network.'));
      events.addEventListener('driver.application.created', () => notify('Your driver application is now in review.'));
    } catch {
      events = null;
    }
    return () => events?.close();
  }, []);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  return (
    <>
      <header className="container">
        <a className="brand" href="#top"><span className="brand-mark">↗</span> milewise</a>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a href="#safety">Safety</a>
          <a href="#drive">Drive with us</a>
        </nav>
        <div className="nav-actions">
          <a className="login" href="#">Log in</a>
          <button className="nav-cta" onClick={() => notify('Sign up is coming soon')}>Create account</button>
        </div>
      </header>

      <main id="top">
        <section className="hero container">
          <div>
            <div className="eyebrow"><i /> Your next ride is nearby</div>
            <h1>Go anywhere.<br /><span>Start here.</span></h1>
            <p className="hero-copy">Tell us where you are and we will connect you with a trusted driver nearby. Use your current location or enter an address yourself.</p>
            <div className="mini-trust">
              <div className="avatars"><span className="avatar">🙂</span><span className="avatar">👩🏽</span><span className="avatar">👨🏻</span></div>
              12,000+ customers are already moving with Milewise
            </div>
          </div>
          <RideFinder notify={notify} />
        </section>

        <div className="strip"><div className="container strip-content"><strong>Every ride, a little easier.</strong><div className="perks"><span className="perk"><b>✓</b> Verified drivers</span><span className="perk"><b>⌁</b> Live location matching</span><span className="perk"><b>♡</b> Clear arrival times</span></div></div></div>

        <section className="section container" id="how-it-works">
          <div className="section-head"><h2>From your location to your destination.</h2><p className="section-intro">Milewise pairs your pick-up point with the closest available drivers, while keeping you in control of the final choice.</p></div>
          <div className="steps">
            <article className="step"><span className="step-number">01</span><h3>Set your pick-up</h3><p>Type an address manually or let your browser use your current location in one tap.</p></article>
            <article className="step"><span className="step-number">02</span><h3>See nearby drivers</h3><p>We surface available drivers with their distance, arrival time, vehicle and customer ratings.</p></article>
            <article className="step"><span className="step-number">03</span><h3>Choose your match</h3><p>Pick the driver that feels right, then get moving with a clear arrival time and a familiar face.</p></article>
          </div>
        </section>

        <section className="section container safety-promise" id="safety">
          <div className="section-head"><h2>Our safety promise.</h2><p className="section-intro">Trust is built into every Milewise match, from the driver review to the moment you arrive.</p></div>
          <div className="safety-grid">
            <article className="safety-item"><span className="safety-icon">✓</span><h3>Drivers are checked</h3><p>We verify identity, driving documents and vehicle details before a driver can accept customer trips. Reviews and reports are monitored continuously.</p></article>
            <article className="safety-item"><span className="safety-icon">⌖</span><h3>Trips stay visible</h3><p>With permission, the app shares live trip location with the customer and our support team. Location sharing stops when the trip ends.</p></article>
            <article className="safety-item"><span className="safety-icon">♡</span><h3>Support is close</h3><p>Customer and driver profiles, trip details and match activity are recorded so our team can respond quickly when something feels wrong.</p></article>
          </div>
          <div className="safety-note"><strong>Your location belongs to you.</strong><span>We collect only what is needed to match and support your ride, protect it in transit and never sell it to advertisers.</span></div>
        </section>
        <section className="container" id="drive"><div className="banner"><div><div className="eyebrow"><i /> Want to drive instead?</div><h2>More freedom. More meaningful miles.</h2><p>Drivers can join the same network, see nearby customer requests and choose when to accept a trip.</p><a className="primary" href="#driver-join">Drive with us&nbsp; →</a></div><div className="route-illustration"><div className="route-label"><span className="pulse" /> 24 customer requests nearby</div><div className="car" /></div></div></section>
        <section className="container driver-join" id="driver-join"><DriverCard notify={notify} /></section>
      </main>

      <footer><div className="container footer-inner"><span>© 2026 Milewise</span><div className="footer-links"><a href="#">Help</a><a href="#">Terms</a><a href="#">Privacy</a></div></div></footer>
      <Toast message={toast} />
    </>
  );
}
