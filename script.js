        document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const urlInput = document.getElementById('url');
            const sizeSelect = document.getElementById('size');
            const imageInput = document.getElementById('image');
            const previewImage = document.getElementById('preview');
            const generateBtn = document.getElementById('generate-btn');
            const loadingDiv = document.getElementById('loading');
            const resultContainer = document.getElementById('result-container');
            const qrCodeImg = document.getElementById('qr-code');
            const downloadBtn = document.getElementById('download-btn');
            const shareBtn = document.getElementById('share-btn');
            const styleToggle = document.getElementById('style-toggle');
            const styleOptions = document.getElementById('style-options');
            const colorOptions = document.querySelectorAll('.color-option');
            const shapeOptions = document.querySelectorAll('.shape-option');
            

            let selectedColor = '#000000';
            let selectedShape = 'square';
            let logoImage = null;
            
            imageInput.addEventListener('change', handleImageUpload);
            generateBtn.addEventListener('click', generateQRCode);
            downloadBtn.addEventListener('click', downloadQRCode);
            shareBtn.addEventListener('click', shareQRCode);
            styleToggle.addEventListener('click', toggleStyleOptions);
            
            colorOptions.forEach(option => {
                option.addEventListener('click', () => {
                    colorOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedColor = `#${option.dataset.color}`;
                });
            });
            
            shapeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    shapeOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    selectedShape = option.dataset.shape;
                });
            });
            

            function handleImageUpload(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        previewImage.src = event.target.result;
                        previewImage.style.display = 'block';
                        logoImage = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            }
            
            function toggleStyleOptions() {
                styleOptions.style.display = styleOptions.style.display === 'none' ? 'block' : 'none';
                styleToggle.classList.toggle('active');
            }
            
            function generateQRCode() {
                const url = urlInput.value.trim();
                const size = parseInt(sizeSelect.value);
                
                if (!url) {
                    showError('Please enter a URL or text');
                    return;
                }
                

                loadingDiv.style.display = 'flex';
                resultContainer.style.display = 'none';
                

                setTimeout(() => {
                    try {
                        const qr = qrcode(0, 'H');
                        qr.addData(url);
                        qr.make();
                        
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const qrSize = qr.getModuleCount();
                        const cellSize = size / qrSize;
                        
                        canvas.width = size;
                        canvas.height = size;
                        
                        drawQRCodeShape(ctx, qr, cellSize, size, selectedShape, selectedColor);
                        
                        if (logoImage) {
                            addLogoToQR(canvas, ctx, size);
                        }
                        
                        qrCodeImg.src = canvas.toDataURL('image/png');
                        
                        loadingDiv.style.display = 'none';
                        resultContainer.style.display = 'block';
                        
                        resultContainer.scrollIntoView({ behavior: 'smooth' });
                    } catch (error) {
                        showError('Error generating QR code. Please try again.');
                        console.error(error);
                        loadingDiv.style.display = 'none';
                    }
                }, 1500); 
            }
            
            function drawQRCodeShape(ctx, qr, cellSize, size, shape, color) {
                const qrSize = qr.getModuleCount();
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
                
                ctx.fillStyle = color;
                
                for (let row = 0; row < qrSize; row++) {
                    for (let col = 0; col < qrSize; col++) {
                        if (qr.isDark(row, col)) {
                            const x = col * cellSize;
                            const y = row * cellSize;
                            
                            switch (shape) {
                                case 'dots':
                                    ctx.beginPath();
                                    ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2 * 0.8, 0, Math.PI * 2);
                                    ctx.fill();
                                    break;
                                case 'rounded':
                                    const radius = cellSize * 0.2;
                                    ctx.beginPath();
                                    ctx.moveTo(x + radius, y);
                                    ctx.lineTo(x + cellSize - radius, y);
                                    ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + radius);
                                    ctx.lineTo(x + cellSize, y + cellSize - radius);
                                    ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - radius, y + cellSize);
                                    ctx.lineTo(x + radius, y + cellSize);
                                    ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - radius);
                                    ctx.lineTo(x, y + radius);
                                    ctx.quadraticCurveTo(x, y, x + radius, y);
                                    ctx.closePath();
                                    ctx.fill();
                                    break;
                                case 'square':
                                default:
                                    ctx.fillRect(x, y, cellSize, cellSize);
                                    break;
                            }
                        }
                    }
                }
            }
            
            function addLogoToQR(canvas, ctx, size) {
                const logoSize = size * 0.2; 
                const logoX = (size - logoSize) / 2;
                const logoY = (size - logoSize) / 2;
                
                const logo = new Image();
                logo.src = logoImage;
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4);
                
                ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            }
            
            function downloadQRCode() {
                const link = document.createElement('a');
                link.download = 'Qrevion-qr-code.png';
                link.href = qrCodeImg.src;
                link.click();
            }
            
            function shareQRCode() {
                if (navigator.share) {
                    navigator.share({
                        title: 'Scan this QR Code',
                        text: 'Generated with Qrevion QR Code Generator',
                        url: urlInput.value.trim(),
                    }).catch(err => {
                        console.log('Error sharing:', err);
                        fallbackShare();
                    });
                } else {
                    fallbackShare();
                }
            }
            
            function fallbackShare() {
                if (navigator.clipboard) {
                    fetch(qrCodeImg.src)
                        .then(res => res.blob())
                        .then(blob => {
                            const item = new ClipboardItem({ 'image/png': blob });
                            navigator.clipboard.write([item]).then(() => {
                                alert('QR code copied to clipboard!');
                            });
                        })
                        .catch(err => {
                            console.error('Error copying to clipboard:', err);
                            alert('Your browser doesn\'t support sharing. Please download the QR code instead.');
                        });
                } else {
                    alert('Your browser doesn\'t support sharing. Please download the QR code instead.');
                }
            }
            
            function showError(message) {
                alert(message);
            }
        });
