import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import '../styles/Contact.css';

type ContactFormState = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

const Contact: React.FC = () => {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const onChange = (key: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setForm(INITIAL_FORM);
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <h1>Contact AutoInsight</h1>
        <p>
          Reach out for support, partnerships, data questions, or general feedback. We are happy to help.
        </p>
      </section>

      <section className="contact-layout" aria-label="Contact details and form">
        <aside className="contact-info-card glass-panel-small">
          <h2>Contact Details</h2>

          <div className="contact-info-row">
            <Mail size={18} />
            <div>
              <h3>Email</h3>
              <a href="mailto:info.autoinsight@gmail.com">info.autoinsight@gmail.com</a>
            </div>
          </div>

          <div className="contact-info-row">
            <Phone size={18} />
            <div>
              <h3>Phone</h3>
              <a href="tel:+94(0)112345678">+94 (0) 11 234 5678</a>
            </div>
          </div>

          <div className="contact-info-row">
            <MapPin size={18} />
            <div>
              <h3>Location</h3>
              <p>Colombo, Sri Lanka</p>
            </div>
          </div>

          <div className="contact-info-row">
            <Clock size={18} />
            <div>
              <h3>Working Hours</h3>
              <p>Mon - Fri, 9:00 AM - 6:00 PM</p>
            </div>
          </div>
        </aside>

        <div className="contact-form-card glass-panel-small">
          <h2>Send Us a Message</h2>
          <p className="contact-form-subtitle">Fill in the form and our team will get back to you soon.</p>

          {submitted && (
            <div className="contact-success" role="status">
              Thanks! Your message has been submitted successfully.
            </div>
          )}

          <form className="contact-form" onSubmit={onSubmit}>
            <div className="contact-grid-2">
              <label>
                Full Name
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => onChange('fullName', event.target.value)}
                  placeholder="Your full name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => onChange('email', event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
            </div>

            <div className="contact-grid-2">
              <label>
                Phone
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => onChange('phone', event.target.value)}
                  placeholder="+94 xx xxx xxxx"
                />
              </label>

              <label>
                Subject
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => onChange('subject', event.target.value)}
                  placeholder="How can we help?"
                  required
                />
              </label>
            </div>

            <label>
              Message
              <textarea
                rows={6}
                value={form.message}
                onChange={(event) => onChange('message', event.target.value)}
                placeholder="Write your message..."
                required
              />
            </label>

            <button className="contact-submit-btn" type="submit">
              <Send size={16} />
              Submit Message
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;
