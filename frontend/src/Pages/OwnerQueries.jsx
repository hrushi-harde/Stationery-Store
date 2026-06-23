import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiEye, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { getContactRequests, updateContactStatus, deleteContactRequest } from '../services/api';
import './OwnerQueries.css';

const OwnerQueries = () => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQueries, setTotalQueries] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    under_review: 0,
    received: 0,
    ignored: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const statusOptions = [
    { value: 'under_review', label: 'Under Review', color: '#f59e0b' },
    { value: 'received', label: 'Received', color: '#10b981' },
    { value: 'ignored', label: 'Ignored', color: '#ef4444' },
  ];

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await getContactRequests(accessToken, currentPage, ITEMS_PER_PAGE);
        if (mounted) {
          setRequests(resp.items || []);
          setTotalPages(resp.total_pages || 1);
          setTotalQueries(resp.total || 0);
          setStatusCounts({
            under_review: resp.status_counts?.under_review || 0,
            received: resp.status_counts?.received || 0,
            ignored: resp.status_counts?.ignored || 0,
          });
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to load queries');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [accessToken, currentPage]);

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleStatusClick = (request) => {
    setCurrentRequest(request);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!currentRequest) return;

    setUpdatingId(currentRequest.id);
    try {
      await updateContactStatus(currentRequest.id, newStatus, accessToken);
      setRequests(requests.map(r => 
        r.id === currentRequest.id 
          ? { ...r, status: newStatus }
          : r
      ));
      setShowStatusModal(false);
      setCurrentRequest(null);
      toast.success('Query status updated successfully');
    } catch (err) {
      toast.error(err.message || 'Unable to update query status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRequest = async (request) => {
    toast((t) => (
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Delete query?</strong>
          <span>Delete query from {request.name}? This action cannot be undone.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={async () => {
              toast.dismiss(t.id);
              setUpdatingId(request.id);
              try {
                await deleteContactRequest(request.id, accessToken);

                if (requests.length === 1 && currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                } else {
                  const resp = await getContactRequests(accessToken, currentPage, ITEMS_PER_PAGE);
                  setRequests(resp.items || []);
                  setTotalPages(resp.total_pages || 1);
                  setTotalQueries(resp.total || 0);
                }

                toast.success('Query deleted successfully');
              } catch (err) {
                toast.error(err.message || 'Unable to delete query');
              } finally {
                setUpdatingId(null);
              }
            }}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              background: '#111827',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              background: '#fff',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: true,
      position: 'top-right',
    });
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.label || status;
  };

  const stats = {
    total: totalQueries,
    underReview: statusCounts.under_review,
    received: statusCounts.received,
    ignored: statusCounts.ignored,
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="owner-queries-container">
      <section className="owner-queries-hero">
        <div>
          <p className="owner-kicker">Owner Inbox</p>
          <h1>All Customer Queries</h1>
          <p>Signed in as {user?.name || 'Shop Owner'}. Manage incoming queries and update their status.</p>
        </div>

        <div className="owner-queries-stats">
          <div className="stat-card stat-total">
            <strong>{stats.total}</strong>
            <span>Total Queries</span>
          </div>
          <div className="stat-card stat-under-review">
            <strong>{stats.underReview}</strong>
            <span>Under Review</span>
          </div>
          <div className="stat-card stat-received">
            <strong>{stats.received}</strong>
            <span>Received</span>
          </div>
          <div className="stat-card stat-ignored">
            <strong>{stats.ignored}</strong>
            <span>Ignored</span>
          </div>
        </div>
      </section>

      {error && <div className="error-message">{error}</div>}

      <section className="queries-table-section">
        {loading ? (
          <div className="loading-state">Loading queries...</div>
        ) : requests.length === 0 && currentPage === 1 ? (
          <div className="empty-state">
            No queries yet. Messages from the Contact Us page will appear here.
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            No queries found on this page.
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="queries-table">
                <thead>
                  <tr>
                    <th>SR. NO.</th>
                    <th>NAME</th>
                    <th>TITLE</th>
                    <th>STATUS</th>
                    <th>CREATED AT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request, index) => (
                    <tr key={request.id}>
                      <td className="serial-number">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="name-cell">
                        <strong>{request.name}</strong>
                        <p>{request.email}</p>
                      </td>
                      <td className="title-cell" title={request.subject}>{request.subject || 'No subject'}</td>
                      <td className="status-cell">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(request.status), opacity: 0.9 }}
                        >
                          {getStatusLabel(request.status)}
                        </span>
                      </td>
                      <td className="date-cell">
                        {new Date(request.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="action-cell">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(request)}
                          title="View details"
                          aria-label="View details"
                        >
                          <FiEye />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleStatusClick(request)}
                          title="Change status"
                          aria-label="Change status"
                          disabled={updatingId === request.id}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteRequest(request)}
                          title="Delete query"
                          aria-label="Delete query"
                          disabled={updatingId === request.id}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  className="pagination-btn prev-btn"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <FiChevronLeft /> Previous
                </button>
                
                <div className="pagination-info">
                  Page <span className="current-page">{currentPage}</span> of <span className="total-pages">{totalPages}</span>
                </div>
                
                <button
                  className="pagination-btn next-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {showDetailModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Query Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-field">
                <label>Name:</label>
                <p>{selectedRequest.name}</p>
              </div>
              <div className="detail-field">
                <label>Email:</label>
                <p>{selectedRequest.email}</p>
              </div>
              <div className="detail-field">
                <label>Subject:</label>
                <p>{selectedRequest.subject || 'No subject'}</p>
              </div>
              <div className="detail-field">
                <label>Status:</label>
                <p>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                  >
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </p>
              </div>
              <div className="detail-field">
                <label>Message:</label>
                <p className="message-content">{selectedRequest.message}</p>
              </div>
              <div className="detail-field">
                <label>Created At:</label>
                <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn primary-btn"
                onClick={() => handleStatusClick(selectedRequest)}
              >
                Change Status
              </button>
              <button
                className="modal-btn secondary-btn"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && currentRequest && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Query Status</h2>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="status-info">
                Query from <strong>{currentRequest.name}</strong>
              </p>
              <div className="status-options">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`status-option ${currentRequest.status === option.value ? 'active' : ''}`}
                    onClick={() => handleUpdateStatus(option.value)}
                    disabled={updatingId === currentRequest.id}
                    style={{
                      borderColor: option.color,
                      backgroundColor: currentRequest.status === option.value ? option.color : 'transparent',
                      color: currentRequest.status === option.value ? 'white' : option.color,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerQueries;

