import React from 'react';
import { IoLocation } from 'react-icons/io5';
import { MdEmail, MdHomeWork } from 'react-icons/md';
import { IoMdCall } from 'react-icons/io';
import '../Pages/Home.css';

const ContactCard = () => {
  return (
    <>
      <section className="contact-section">
        <div className="contact-container">
          <h2>Contact Us</h2>
          <p className="subtext">We’re happy to assist you. Reach out to us anytime!</p>

          <div className="contact-details">
            <p>
              <strong><IoLocation className="icon" /> Address:</strong> Deolali Pravara, Tal- Rahuri, Dist- Ahmednagar, Maharashtra 413716
            </p>
            <p>
              <strong><MdEmail className="icon" /> Email:</strong> hrushiharde96@gmail.com
            </p>
            <p>
              <strong><IoMdCall className="icon" /> Phone:</strong> +91 8999516343
            </p>
            <p>
              <strong><MdHomeWork className="icon" /> Hours:</strong> Tuesday - Sunday, 9:30 AM - 6:30 PM
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactCard;
