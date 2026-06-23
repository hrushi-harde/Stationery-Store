import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { createProduct, getOwnerProducts, updateProduct, uploadProductImage } from '../services/api';
import './OwnerProducts.css';

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  offer_price: '',
  image_url: '',
  is_active: true,
};

const MAX_IMAGE_DIMENSION = 1280;
const IMAGE_QUALITY = 0.78;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image file.'));
    };

    image.src = objectUrl;
  });

const compressImageFile = async (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file.');
  }

  const image = await loadImage(file);
  const { width, height } = image;
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image compression is not supported in this browser.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp');

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Unable to process image.'));
          return;
        }
        resolve(result);
      },
      supportsWebp ? 'image/webp' : 'image/jpeg',
      IMAGE_QUALITY
    );
  });

  const outputExtension = blob.type === 'image/webp' ? '.webp' : '.jpg';
  return new File([blob], file.name.replace(/\.[^.]+$/, outputExtension), {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
};

const OwnerProducts = () => {
  const pageSize = 5;
  const { accessToken, user } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getOwnerProducts(accessToken);
      setProducts(response.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setForm({
      name: selectedProduct.name || '',
      category: selectedProduct.category || '',
      description: selectedProduct.description || '',
      price: selectedProduct.price ?? '',
      offer_price: selectedProduct.offerPrice ?? selectedProduct.offer_price ?? '',
      image_url: selectedProduct.image_url || selectedProduct.image || '',
      is_active: Boolean(selectedProduct.isActive ?? selectedProduct.is_active),
    });
  }, [selectedProduct]);

  const resetForm = () => {
    setSelectedProductId(null);
    setForm(emptyForm);
    setPreviewUrl('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      offer_price: Number(form.offer_price),
      image_url: form.image_url.trim(),
      is_active: Boolean(form.is_active),
    };

    if (!payload.image_url) {
      setSaving(false);
      setMessage('Please upload a product image.');
      return;
    }

    try {
      if (selectedProductId) {
        await updateProduct(selectedProductId, payload, accessToken);
        setMessage('Product updated.');
      } else {
        await createProduct(payload, accessToken);
        setMessage('Product added.');
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      setMessage(error.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);
    setMessage('');
    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl((previousPreviewUrl) => {
        if (previousPreviewUrl) {
          URL.revokeObjectURL(previousPreviewUrl);
        }
        return localPreview;
      });

      const optimizedFile = await compressImageFile(file);
      const result = await uploadProductImage(optimizedFile, accessToken, {
        onProgress: setUploadProgress,
      });
      setForm((prev) => ({ ...prev, image_url: result.image_url || '' }));
      setMessage('Image uploaded successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to upload image.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };
 
  const handleToggleArchive = async (product) => {
    const isActive = Boolean(product.isActive ?? product.is_active);
    setMessage('');

    try {
      await updateProduct(product.id, { is_active: !isActive }, accessToken);
      setMessage(isActive ? 'Product archived.' : 'Product restored.');
      await loadProducts();
      if (selectedProductId === product.id && isActive) {
        setForm({ ...form, is_active: false });
      }
      if (selectedProductId === product.id && !isActive) {
        setForm({ ...form, is_active: true });
      }
    } catch (error) {
      setMessage(error.message || 'Unable to archive product.');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const activeCount = products.filter((product) => product.isActive ?? product.is_active).length;
    const inactiveCount = products.length - activeCount;
    const averagePrice = products.length
      ? Math.round(products.reduce((sum, product) => sum + Number(product.offerPrice ?? product.offer_price ?? 0), 0) / products.length)
      : 0;

    return { total: products.length, activeCount, inactiveCount, averagePrice };
  }, [products]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(products.length / pageSize)),
    [products.length, pageSize]
  );

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return products.slice(startIndex, startIndex + pageSize);
  }, [products, currentPage, pageSize]);

  const pageStart = products.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, products.length);

  useEffect(() => {
    setCurrentPage((prevPage) => Math.min(prevPage, totalPages));
  }, [totalPages]);

  return (
    <div className="owner-page">
      <section className="owner-hero">
        <div>
          <p className="owner-kicker">Owner control center</p>
          <h1>Manage catalog, publish products, and keep the storefront current.</h1>
          <p>
            Signed in as {user?.name || 'Shop Owner'}.
            Use this panel to add new products or edit existing details.
          </p>
          <div className="owner-actions">
            <Link to="/owner/queries" className="ghost-btn owner-queries-cta">
              View contact requests
            </Link>
          </div>
        </div>

        <div className="owner-stats">
          <div><strong>{stats.total}</strong><span>Total products</span></div>
          <div><strong>{stats.activeCount}</strong><span>Active</span></div>
          <div><strong>{stats.inactiveCount}</strong><span>Hidden</span></div>
          <div><strong>₹{stats.averagePrice}</strong><span>Avg. offer price</span></div>
        </div>
      </section>

      <section className="owner-layout">
        <form className="owner-form" onSubmit={handleSubmit}>
          <div className="owner-form-header">
            <h2>{selectedProductId ? 'Edit product' : 'Add product'}</h2>
            {selectedProductId && (
              <button type="button" className="ghost-btn" onClick={resetForm}>
                New product
              </button>
            )}
          </div>

          <div className="field-grid">
            <label>
              Product name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Category
              <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            </label>
            <label>
              Price
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
            </label>
            <label>
              Offer price
              <input type="number" min="0" step="0.01" value={form.offer_price} onChange={(event) => setForm({ ...form, offer_price: event.target.value })} required />
            </label>
          </div>

          <label>
            Product image file
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
            <small className="owner-input-note">
              {uploadingImage
                ? 'Uploading image...'
                : 'Upload jpg, png, webp, gif, or avif up to 5MB.'}
            </small>
          </label>

          {uploadingImage && (
            <div className="upload-progress">
              <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}

          {(previewUrl || form.image_url) && (
            <div className="owner-image-preview">
              <img src={previewUrl || form.image_url} alt="Uploaded product preview" />
              <span>{form.image_url}</span>
            </div>
          )}

          <label>
            Description
            <textarea rows="5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </label>

          <label className="switch-row">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            Publish product
          </label>

          <div className="owner-actions">
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Saving...' : selectedProductId ? 'Update product' : 'Add product'}
            </button>
          </div>

          {message && <p className="owner-message">{message}</p>}
        </form>

        <div className="owner-list">
          <div className="owner-list-header">
            <h2>Existing products</h2>
            <span>{loading ? 'Loading...' : `${products.length} items`}</span>
          </div>

          <div className="product-admin-grid">
            {paginatedProducts.map((product) => {
              const active = product.isActive ?? product.is_active;
              return (
                <article key={product.id} className={`admin-card ${active ? '' : 'inactive'}`}>
                  <img src={product.image || product.image_url} alt={product.name} />
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category}</p>
                    <p className="price-row">₹{product.offerPrice ?? product.offer_price} <span>₹{product.price}</span></p>
                    <p className="status-row">{active ? 'Published' : 'Hidden'}</p>
                  </div>
                  <div className="admin-card-actions">
                    <button type="button" className="ghost-btn" onClick={() => setSelectedProductId(product.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => handleToggleArchive(product)}
                      disabled={saving}
                    >
                      {active ? 'Archive' : 'Restore'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {!loading && products.length > 0 && (
            <div className="owner-pagination">
              <span className="owner-pagination-meta">
                Showing {pageStart}-{pageEnd} of {products.length}
              </span>
              <div className="owner-pagination-controls">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setCurrentPage((prevPage) => Math.max(prevPage - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`ghost-btn page-btn ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OwnerProducts;