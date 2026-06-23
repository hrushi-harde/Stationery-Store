import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getContactRequests } from '../services/api';
import './OwnerProducts.css';
import './OwnerContacts.css';

const OwnerContacts = () => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setMessage('');

      try {
        const response = await getContactRequests(accessToken);
        if (mounted) {
          setRequests(response.items || []);
        }
      } catch (error) {
        if (mounted) {
          setRequests([]);
          setMessage(error.message || 'Unable to load contact requests.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadRequests();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  const stats = useMemo(() => {
    const uniqueSenders = new Set(requests.map((request) => request.email.toLowerCase())).size;
    const latestRequest = requests[0]?.createdAt ? new Date(requests[0].createdAt) : null;

    return {
      total: requests.length,
      uniqueSenders,
      latest: latestRequest ? latestRequest.toLocaleString() : 'No messages yet',
    };
  }, [requests]);

  return (
    <div className="owner-page">
      <section className="owner-hero">
        <div>
          <p className="owner-kicker">Owner inbox</p>
          <h1>Customer contact requests</h1>
          <p>
            Review messages submitted from the Contact Us page.
            {' '}
            Signed in as {user?.name || 'Shop Owner'}.
          </p>
          <div className="owner-actions">
            <Link to="/owner" className="ghost-btn">
              Back to products
            </Link>
          </div>
        </div>

        <div className="owner-stats">
          <div><strong>{stats.total}</strong><span>Total messages</span></div>
          <div><strong>{stats.uniqueSenders}</strong><span>Unique senders</span></div>
          <div><strong>{loading ? '...' : requests.length > 0 ? 'Live' : 'Idle'}</strong><span>Status</span></div>
          <div><strong>{stats.latest}</strong><span>Latest</span></div>
        </div>
      </section>

      <section className="owner-list">
        <div className="owner-list-header">
          <h2>Incoming requests</h2>
          <span>{loading ? 'Loading...' : `${requests.length} messages`}</span>
        </div>

        {message && <p className="owner-message">{message}</p>}

        <div className="contact-requests-grid">
          {requests.map((request) => {
            const subject = request.subject || 'No subject';
            const replySubject = encodeURIComponent(`Re: ${subject}`);
            const replyBody = encodeURIComponent(`Hi ${request.name},\n\n`);

            return (
              <article key={request.id} className="contact-request-card">
                <div className="contact-request-top">
                  <div>
                    <h3>{request.name}</h3>
                    <p>{request.email}</p>
                  </div>
                  <span className="contact-request-date">
                    {new Date(request.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="contact-request-subject">{subject}</p>
                <p className="contact-request-message">{request.message}</p>

                <a
                  href={`mailto:${request.email}?subject=${replySubject}&body=${replyBody}`}
                  className="ghost-btn"
                >
                  Reply by email
                </a>
              </article>
            );
          })}
        </div>

        {!loading && requests.length === 0 && !message && (
          <div className="contact-empty-state">
            No contact requests yet. Messages from the Contact Us page will appear here.
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerContacts;
