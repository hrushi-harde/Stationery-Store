import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import ContactCard from "../Components/ContactCard";
import { submitContactRequest } from "../services/api";
import "./ContactUs.css";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const ContactUs = () => {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);

  useEffect(() => {
    if (!successPopupOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setSuccessPopupOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [successPopupOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);

    try {
      await submitContactRequest(form);
      setSuccessPopupOpen(true);
      setForm(initialForm);
    } catch (submissionError) {
      toast.error(submissionError.message || "Unable to send your message right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="contact-section">
      {successPopupOpen && (
        <div
          className="contact-success-overlay"
          role="presentation"
          onClick={() => setSuccessPopupOpen(false)}
        >
          <div
            className="contact-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-success-title"
            aria-describedby="contact-success-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="contact-success-icon" aria-hidden="true">
              <span className="contact-success-check">✓</span>
            </div>
            <h3 id="contact-success-title">Thank You!</h3>
            <p id="contact-success-description">
              Your message has been successfully submitted. We’ll review it and get back to you soon.
            </p>
            <button type="button" className="contact-success-button" onClick={() => setSuccessPopupOpen(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="contact-container">
        <div className="contact-info">
          <h2>Get in Touch</h2>
          <p>
            We’d love to hear from you! Whether it's a question, feedback, or
            just a hello 👋
          </p>
          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3>Send Us a Message</h3>
              <input
                name="name"
                type="text"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                name="subject"
                type="text"
                placeholder="Subject"
                value={form.subject}
                onChange={handleChange}
              />
              <textarea
                name="message"
                rows="5"
                placeholder="Your Message"
                value={form.message}
                onChange={handleChange}
                required
              />
              <button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <ContactCard></ContactCard>
    </section>
  );
};

export default ContactUs;
