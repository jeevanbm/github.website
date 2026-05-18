(function() {
  const root = /** @type {HTMLElement | null} */ (document.querySelector('[data-studio-root]'));
  if (!root) return;

  const FRONT_MASK = root.dataset.modelTshirtFront;
  const BACK_MASK = root.dataset.modelTshirtBack;
  const FIXED_PRICE = root.dataset.fixedPrice || '899';
  const CURRENCY = root.dataset.currencySymbol || '₹';

  // Products JSON
  const productsEl = root.querySelector('[data-studio-products]');
  const PRODUCTS = productsEl ? JSON.parse(productsEl.textContent || '{}') : {};

  // DOM refs
  const frontCanvas = /** @type {HTMLCanvasElement | null} */ (root.querySelector('[data-studio-canvas="front"]'));
  const backCanvas = /** @type {HTMLCanvasElement | null} */ (root.querySelector('[data-studio-canvas="back"]'));
  const frontCtx = frontCanvas ? frontCanvas.getContext('2d') : null;
  const backCtx = backCanvas ? backCanvas.getContext('2d') : null;
  const frontCard = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-preview-card="front"]'));
  const backCard = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-preview-card="back"]'));
  const garmentSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-garment]'));
  const sizeSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-size]'));
  const swatches = /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll('[data-studio-swatch]'));
  const customColorPicker = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-picker]'));
  const customColorHex = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-hex]'));
  const customColorApply = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-custom-color-apply]'));
  const uploadInput = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-upload]'));
  const uploadTrigger = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-trigger]'));
  const uploadName = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-upload-name]'));
  const placementSelect = /** @type {HTMLSelectElement | null} */ (root.querySelector('[data-studio-placement]'));
  const editTabs = /** @type {NodeListOf<HTMLElement>} */ (root.querySelectorAll('[data-studio-edit-side]'));
  const resetBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-reset-side]'));
  const submitBtn = /** @type {HTMLButtonElement | null} */ (root.querySelector('[data-studio-submit]'));
  const priceDisplay = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-price]'));
  const statusEl = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-status]'));
  const form = /** @type {HTMLFormElement | null} */ (root.querySelector('[data-studio-form]'));

  // Readouts
  const garmentReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-garment-readout]'));
  const sizeReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-size-readout]'));
  const colorReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-color-readout]'));
  const washReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-wash-readout]'));
  const fileReadout = /** @type {HTMLElement | null} */ (root.querySelector('[data-studio-file-readout]'));

  // Hidden inputs
  const variantIdInput = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-variant-id]'));
  const sizeProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-size-property]'));
  const colorProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-color-property]'));
  const washProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-wash-property]'));
  const colorSourceProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-color-source-property]'));
  const customColorProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-custom-color-property]'));
  const scaleProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-scale-property]'));
  const artworkNameProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-artwork-name-property]'));
  const frontTransformProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-front-transform-property]'));
  const backTransformProperty = /** @type {HTMLInputElement | null} */ (root.querySelector('[data-studio-back-transform-property]'));

  // State
  let currentColor = root.dataset.defaultColor || '#828FB2';
  let currentColorName = root.dataset.defaultColorName || 'Acid Wash Blue';
  let currentWash = root.dataset.defaultWash || 'acid-blue';
  let currentGarment = 'tshirt';
  /** @type {'front' | 'back'} */
  let activeSide = 'front';
  /** @type {HTMLImageElement | null} */
  let artworkImg = null;
  /** @type {Record<'front' | 'back', { x: number, y: number, scale: number }>} */
  let artworkTransforms = { front: { x: 0.3, y: 0.25, scale: 0.35 }, back: { x: 0.3, y: 0.25, scale: 0.35 } };
  let isDragging = false;
  let isResizing = false;
  let dragStart = { x: 0, y: 0 };
  /** @type {{ front: HTMLImageElement | null, back: HTMLImageElement | null }} */
  let maskImages = { front: null, back: null };

  // Load mask images
  /**
   * @param {string | undefined} url
   * @returns {Promise<HTMLImageElement | null>}
   */
  function loadMask(url) {
    return new Promise((resolve) => {
      if (!url) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  async function initMasks() {
    maskImages.front = await loadMask(FRONT_MASK);
    maskImages.back = await loadMask(BACK_MASK);
    renderBothCanvases();
  }

  // Render canvas
  /**
   * @param {CanvasRenderingContext2D | null} ctx
   * @param {HTMLCanvasElement | null} canvas
   * @param {'front' | 'back'} side
   */
  function renderCanvas(ctx, canvas, side) {
    if (!ctx || !canvas) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background color fill
    ctx.fillStyle = currentColor;
    ctx.fillRect(0, 0, w, h);

    // Mask overlay
    const mask = maskImages[side];
    if (mask) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Artwork
    const placement = placementSelect?.value || 'both';
    if (artworkImg && (placement === side || placement === 'both')) {
      const t = artworkTransforms[side];
      const aw = w * t.scale;
      const ah = (artworkImg.height / artworkImg.width) * aw;
      const ax = t.x * w;
      const ay = t.y * h;
      ctx.drawImage(artworkImg, ax, ay, aw, ah);

      // Draw resize handle if active
      if (activeSide === side) {
        ctx.strokeStyle = 'rgba(252,246,186,0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(ax, ay, aw, ah);
        ctx.setLineDash([]);
        // Corner handle
        ctx.fillStyle = '#fcf6ba';
        ctx.fillRect(ax + aw - 6, ay + ah - 6, 12, 12);
      }
    }
  }

  function renderBothCanvases() {
    renderCanvas(frontCtx, frontCanvas, 'front');
    renderCanvas(backCtx, backCanvas, 'back');
  }

  // Populate size dropdown
  function populateSizes() {
    if (!sizeSelect) return;
    const product = PRODUCTS[currentGarment];
    if (!product) return;
    sizeSelect.innerHTML = '';
    product.variants.forEach((/** @type {any} */ v) => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.title;
      if (!v.available) opt.disabled = true;
      sizeSelect.appendChild(opt);
    });
    updateSizeReadout();
    updateVariantId();
  }

  function updateVariantId() {
    if (variantIdInput && sizeSelect) variantIdInput.value = sizeSelect.value;
  }

  function updateSizeReadout() {
    if (sizeReadout && sizeSelect) {
      const opt = sizeSelect.options[sizeSelect.selectedIndex];
      sizeReadout.textContent = opt ? opt.textContent : 'Not selected';
    }
    if (sizeProperty && sizeSelect) {
      const opt = sizeSelect.options[sizeSelect.selectedIndex];
      sizeProperty.value = opt ? opt.textContent : '';
    }
  }

  // Swatch selection
  /**
   * @param {HTMLElement} el
   */
  function selectSwatch(el) {
    swatches.forEach(s => s.classList.remove('is-active'));
    el.classList.add('is-active');
    currentColor = el.dataset.color || '#828FB2';
    currentColorName = el.dataset.colorName || 'Acid Wash Blue';
    currentWash = el.dataset.wash || 'acid-blue';
    if (colorProperty) colorProperty.value = currentColorName + ' (' + currentColor + ')';
    if (washProperty) washProperty.value = currentColorName;
    if (colorSourceProperty) colorSourceProperty.value = currentWash === 'solid' ? 'Solid swatch' : 'Acid swatch';
    if (customColorProperty) customColorProperty.value = '';
    if (colorReadout) colorReadout.textContent = currentColorName;
    if (washReadout) washReadout.textContent = currentColorName;
    renderBothCanvases();
  }

  // Canvas interaction (drag artwork)
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {any} e
   * @returns {{ x: number, y: number }}
   */
  function getCanvasCoords(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  /**
   * @param {HTMLCanvasElement | null} canvas
   * @param {'front' | 'back'} side
   */
  function setupCanvasInteraction(canvas, side) {
    if (!canvas) return;
    const onDown = (/** @type {any} */ e) => {
      if (!artworkImg) return;
      e.preventDefault();
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      const aw = t.scale;
      const ah = (artworkImg.height / artworkImg.width) * aw;
      // Check resize handle
      if (pos.x >= t.x + aw - 0.03 && pos.y >= t.y + ah - 0.03) {
        isResizing = true;
      } else if (pos.x >= t.x && pos.x <= t.x + aw && pos.y >= t.y && pos.y <= t.y + ah) {
        isDragging = true;
      }
      dragStart = pos;
      activeSide = side;
      updateEditTabs();
    };
    const onMove = (/** @type {any} */ e) => {
      if (!isDragging && !isResizing) return;
      e.preventDefault();
      const pos = getCanvasCoords(canvas, e);
      const t = artworkTransforms[side];
      if (isDragging) {
        t.x += pos.x - dragStart.x;
        t.y += pos.y - dragStart.y;
      } else if (isResizing) {
        const dx = pos.x - dragStart.x;
        t.scale = Math.max(0.1, t.scale + dx);
      }
      dragStart = pos;
      renderBothCanvases();
      updateTransformProperties();
    };
    const onUp = () => { isDragging = false; isResizing = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
  }

  function updateTransformProperties() {
    if (frontTransformProperty) frontTransformProperty.value = JSON.stringify(artworkTransforms.front);
    if (backTransformProperty) backTransformProperty.value = JSON.stringify(artworkTransforms.back);
  }

  function updateEditTabs() {
    editTabs.forEach(t => {
      t.classList.toggle('is-active', t.dataset.studioEditSide === activeSide);
    });
    frontCard?.classList.toggle('is-active', activeSide === 'front');
    backCard?.classList.toggle('is-active', activeSide === 'back');
    renderBothCanvases();
  }

  // Event listeners
  garmentSelect?.addEventListener('change', () => {
    currentGarment = garmentSelect.value;
    if (garmentReadout) garmentReadout.textContent = PRODUCTS[currentGarment]?.label || currentGarment;
    populateSizes();
    renderBothCanvases();
  });

  sizeSelect?.addEventListener('change', () => {
    updateSizeReadout();
    updateVariantId();
  });

  swatches.forEach(s => s.addEventListener('click', () => selectSwatch(s)));

  customColorPicker?.addEventListener('input', () => {
    if (customColorHex) customColorHex.value = customColorPicker.value;
  });

  customColorApply?.addEventListener('click', () => {
    const hex = customColorHex?.value || customColorPicker?.value;
    if (!hex) return;
    swatches.forEach(s => s.classList.remove('is-active'));
    currentColor = hex;
    currentColorName = 'Custom (' + hex + ')';
    currentWash = 'custom';
    if (colorProperty) colorProperty.value = currentColorName;
    if (washProperty) washProperty.value = 'Custom';
    if (colorSourceProperty) colorSourceProperty.value = 'Custom picker';
    if (customColorProperty) customColorProperty.value = hex;
    if (colorReadout) colorReadout.textContent = currentColorName;
    if (washReadout) washReadout.textContent = 'Custom';
    renderBothCanvases();
  });

  uploadTrigger?.addEventListener('click', () => uploadInput?.click());

  uploadInput?.addEventListener('change', () => {
    const file = uploadInput.files ? uploadInput.files[0] : null;
    if (!file) return;
    if (uploadName) uploadName.textContent = file.name;
    if (fileReadout) fileReadout.textContent = file.name;
    if (artworkNameProperty) artworkNameProperty.value = file.name;
    const reader = new FileReader();
    reader.onload = (/** @type {any} */ e) => {
      const img = new Image();
      img.onload = () => {
        artworkImg = img;
        artworkTransforms = { front: { x: 0.3, y: 0.25, scale: 0.35 }, back: { x: 0.3, y: 0.25, scale: 0.35 } };
        renderBothCanvases();
        updateTransformProperties();
      };
      if (e.target && typeof e.target.result === 'string') {
        img.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  });

  placementSelect?.addEventListener('change', renderBothCanvases);

  editTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeSide = /** @type {'front' | 'back'} */ (tab.dataset.studioEditSide || 'front');
      updateEditTabs();
    });
  });

  resetBtn?.addEventListener('click', () => {
    artworkTransforms[activeSide] = { x: 0.3, y: 0.25, scale: 0.35 };
    renderBothCanvases();
    updateTransformProperties();
  });

  frontCard?.addEventListener('click', () => { activeSide = 'front'; updateEditTabs(); });
  backCard?.addEventListener('click', () => { activeSide = 'back'; updateEditTabs(); });

  // Form submit with canvas snapshots
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form) return;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Adding to cart...'; }
    if (statusEl) statusEl.textContent = 'Generating previews...';

    // Generate snapshots
    try {
      const frontBlob = frontCanvas ? await new Promise(r => frontCanvas.toBlob(r, 'image/png')) : null;
      const backBlob = backCanvas ? await new Promise(r => backCanvas.toBlob(r, 'image/png')) : null;

      const formData = new FormData(form);
      if (frontBlob) formData.set('properties[Front Preview Snapshot]', /** @type {Blob} */ (frontBlob), 'front-preview.png');
      if (backBlob) formData.set('properties[Back Preview Snapshot]', /** @type {Blob} */ (backBlob), 'back-preview.png');

      if (statusEl) statusEl.textContent = 'Adding to cart...';

      const res = await fetch('/cart/add.js', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Cart error');

      // Track via Shopify analytics
      if (window.Shopify?.analytics?.publish) {
        window.Shopify.analytics.publish('designer_funnel_progress', { step: 'Added_To_Cart' });
      }

      window.location.href = '/cart';
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = 'Error adding to cart. Please try again.';
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Add to cart - ' + CURRENCY + FIXED_PRICE; }
    }
  });

  // Setup canvas interactions
  setupCanvasInteraction(frontCanvas, 'front');
  setupCanvasInteraction(backCanvas, 'back');

  // Initialize
  populateSizes();
  if (priceDisplay) priceDisplay.textContent = CURRENCY + FIXED_PRICE;
  initMasks();
})();
