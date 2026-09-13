import { useState } from 'react';
import './styles.css';

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>;
}

function BookingCard({ notify }) {
  const [tripType, setTripType] = useState('Round trip');
  const [form, setForm] = useState({
    pickup: '',
    dropoff: '',
    date: '',
    passengers: '4',
  });

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function submitBooking(event) {
    event.preventDefault();
    notify(`Great choice. We are finding your best matches for ${form.passengers} passengers.`);
  }

  return (
    <form className="booking-card" onSubmit={submitBooking}>
      <div className="card-heading">
        <div>
          <h2>Plan your journey</h2>
          <p>Find your family’s perfect ride</p>
        </div>
        <button
          type="button"
          className="round-trip"
          onClick={() => setTripType(tripType === 'Round trip' ? 'One way' : 'Round trip')}
        >
          {tripType}
        </button>
      </div>

      <div className="route-fields">
        <div className="field">
          <span className="field-icon">A</span>
          <div>
            <label htmlFor="pickup">Pick-up</label>
            <input id="pickup" name="pickup" value={form.pickup} onChange={updateField} required placeholder="Enter your starting point" />
          </div>
        </div>
        <div className="field">
          <span className="field-icon">B</span>
          <div>
            <label htmlFor="dropoff">Drop-off</label>
            <input id="dropoff" name="dropoff" value={form.dropoff} onChange={updateField} required placeholder="Where are you headed?" />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <span className="field-icon">▣</span>
            <div>
              <label htmlFor="date">Departure</label>
              <input id="date" name="date" value={form.date} onChange={updateField} type="date" required />
            </div>
          </div>
          <div className="field">
            <span className="field-icon">♧</span>
            <div>
              <label htmlFor="passengers">Passengers</label>
              <input id="passengers" name="passengers" value={form.passengers} onChange={updateField} type="number" min="1" max="8" required />
            </div>
          </div>
        </div>
      </div>

      <button className="find-button" type="submit">See available drivers <span>→</span></button>
      <p className="form-note">No payment required to browse</p>
    </form>
  );
}

export default function App() {
  const [toast, setToast] = useState('');

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
            <div className="eyebrow"><i /> Long trips, made personal</div>
            <h1>Go farther.<br /><span>Stay together.</span></h1>
            <p className="hero-copy">A comfortable car and a trusted driver for the family journeys that matter. Door-to-door, with room for everyone and everything.</p>
            <div className="mini-trust">
              <div className="avatars"><span className="avatar">🙂</span><span className="avatar">👩🏽</span><span className="avatar">👨🏻</span></div>
              Loved by 12,000+ travelling families
            </div>
          </div>
          <BookingCard notify={notify} />
        </section>

        <div className="strip"><div className="container strip-content"><strong>Your people. Your pace.</strong><div className="perks"><span className="perk"><b>✓</b> Verified drivers</span><span className="perk"><b>⌁</b> Spacious cars</span><span className="perk"><b>♡</b> Flexible stops</span></div></div></div>

        <section className="section container" id="how-it-works">
          <div className="section-head"><h2>Travel should feel like the destination.</h2><p className="section-intro">From the first hello to the final drop-off, Milewise puts the comfort of your family first.</p></div>
          <div className="steps">
            <article className="step"><span className="step-number">01</span><h3>Tell us the plan</h3><p>Share your route, date and crew. We’ll show you drivers and cars that fit your trip.</p></article>
            <article className="step"><span className="step-number">02</span><h3>Meet your match</h3><p>Compare profiles, reviews and clear prices. Chat before you book so everyone feels good.</p></article>
            <article className="step"><span className="step-number">03</span><h3>Enjoy the ride</h3><p>Settle in, make a stop, play your playlist. Your driver handles the road, you make the memories.</p></article>
          </div>
        </section>

        <section className="container" id="safety"><div className="banner"><div><div className="eyebrow"><i /> Peace of mind included</div><h2>More than a ride. A little room to breathe.</h2><p>Every Milewise driver is background-checked, reviewed by real families and trained to make long-distance travel feel easy.</p><a className="primary" href="#">Our safety promise&nbsp; →</a></div><div className="route-illustration"><div className="car" /></div></div></section>
      </main>

      <footer><div className="container footer-inner"><span>© 2026 Milewise</span><div className="footer-links"><a href="#">Help</a><a href="#">Terms</a><a href="#">Privacy</a></div></div></footer>
      <Toast message={toast} />
    </>
  );
}
