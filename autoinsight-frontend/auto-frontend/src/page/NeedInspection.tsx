import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Mail, MessageCircle, Phone } from 'lucide-react';
import type { Vehicle } from '../services/vehicleDataService';
import type { StoredVehicleSummary } from '../services/marketplaceStorage';
import '../styles/NeedInspection.css';

type VehicleLike = Vehicle | StoredVehicleSummary;

type InspectionPartner = {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  note?: string;
};

const DRIVEHUB: InspectionPartner = {
  name: 'DriveHub',
  email: 'info@drivehub.lk',
  phone: '0777 592 394',
  whatsapp: '0777 592 394',
  note: 'Colombo & suburbs coverage. Typical response within the hour.',
};

function cleanPhoneLk(number?: string): { raw: string; e164: string } {
  if (!number) return { raw: '', e164: '' };
  const digits = number.replace(/\D/g, '');
  if (!digits) return { raw: '', e164: '' };
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  const e164 = `94${local}`;
  return { raw: digits, e164 };
}

function vehicleLabel(vehicle?: VehicleLike): string {
  if (!vehicle) return 'this vehicle';
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim();
}

function fallbackListingUrl(vehicle?: VehicleLike): string {
  if (!vehicle) return window.location.origin;
  if (vehicle.vehicleUrl) return vehicle.vehicleUrl;
  return `${window.location.origin}/vehicle/${encodeURIComponent(vehicle.id)}`;
}

const NeedInspection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vehicle = (location.state as { vehicle?: VehicleLike } | null)?.vehicle;
  const [copied, setCopied] = useState(false);

  const partner = DRIVEHUB;
  const phone = cleanPhoneLk(partner.phone);
  const whatsapp = cleanPhoneLk(partner.whatsapp);

  const listingUrl = useMemo(() => fallbackListingUrl(vehicle), [vehicle]);

  const message = useMemo(
    () => `Hi, I need inspection for this vehicle: ${vehicleLabel(vehicle)}. ${listingUrl}`,
    [vehicle, listingUrl],
  );

  const emailSubject = `Inspection request: ${vehicleLabel(vehicle)}`;
  const emailHref = partner.email
    ? `mailto:${partner.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`
    : undefined;
  const whatsappHref = whatsapp.e164 ? `https://wa.me/${whatsapp.e164}?text=${encodeURIComponent(message)}` : undefined;
  const phoneHref = phone.raw ? `tel:${phone.raw}` : undefined;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="inspection-page">
      <div className="inspection-header">
        <button className="back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <p className="eyebrow">Need inspection</p>
          <h1>Book a pre-purchase inspection in one tap</h1>
          <p className="muted">
            We show your selected vehicle and pre-fill a message for our trusted inspection partner. Choose email, WhatsApp, or call.
          </p>
        </div>
      </div>

      <div className="inspection-grid">
        <section className="inspection-card">
          <header className="card-header">
            <div>
              <p className="eyebrow">Vehicle details</p>
              <h2>{vehicleLabel(vehicle)}</h2>
            </div>
            {vehicle?.vehicleUrl && (
              <a className="pill-link" href={vehicle.vehicleUrl} target="_blank" rel="noopener noreferrer">
                View listing
                <ExternalLink size={14} />
              </a>
            )}
          </header>

          {vehicle ? (
            <dl className="vehicle-specs">
              <div>
                <dt>Price</dt>
                <dd>{vehicle.price ? `LKR ${vehicle.price.toFixed(2)}M` : '—'}</dd>
              </div>
              <div>
                <dt>Mileage</dt>
                <dd>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '—'}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{vehicle.district || 'Not specified'}</dd>
              </div>
            </dl>
          ) : (
            <div className="empty-vehicle">
              <p>No vehicle was attached. Go back and tap “Need Inspection” on a listing.</p>
            </div>
          )}

          <div className="message-box">
            <div className="message-header">
              <p className="eyebrow">Quick message</p>
              <button className="ghost-btn" onClick={handleCopy}>
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy text'}
              </button>
            </div>
            <p className="message-body">{message}</p>
          </div>
        </section>

        <section className="inspection-card">
          <header className="card-header">
            <div>
              <p className="eyebrow">Inspection partner</p>
              <h2>{partner.name}</h2>
              {partner.note ? <p className="muted">{partner.note}</p> : null}
            </div>
          </header>

          <div className="contact-rows">
            {partner.email && (
              <div className="contact-row">
                <Mail size={16} />
                <div>
                  <p className="label">Email</p>
                  <a href={`mailto:${partner.email}`}>{partner.email}</a>
                </div>
              </div>
            )}
            {partner.phone && (
              <div className="contact-row">
                <Phone size={16} />
                <div>
                  <p className="label">Phone</p>
                  <a href={phoneHref}>{partner.phone}</a>
                </div>
              </div>
            )}
            {partner.whatsapp && (
              <div className="contact-row">
                <MessageCircle size={16} />
                <div>
                  <p className="label">WhatsApp</p>
                  <a href={whatsappHref}>{partner.whatsapp}</a>
                </div>
              </div>
            )}
          </div>

          <div className="action-buttons">
            {whatsappHref && (
              <a className="action-btn primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} />
                WhatsApp with message
              </a>
            )}
            {emailHref && (
              <a className="action-btn secondary" href={emailHref}>
                <Mail size={16} />
                Email with message
              </a>
            )}
            {phoneHref && (
              <a className="action-btn ghost" href={phoneHref}>
                <Phone size={16} />
                Call now
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default NeedInspection;
