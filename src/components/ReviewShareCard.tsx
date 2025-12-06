import React, { useRef, useEffect, useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { logger } from '../utils/logger';
import type { AlbumReview, SpotifyAlbum } from '../types';
import '../styles/components/ReviewShareCard.css';

interface ReviewShareCardProps {
  review: AlbumReview;
  album: SpotifyAlbum;
  userName?: string;
  userAvatar?: string;
  onClose: () => void;
}

export const ReviewShareCard: React.FC<ReviewShareCardProps> = ({
  review,
  album,
  userName = 'Anonymous',
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    generateCardImage();
  }, [review, album]);

  const generateCardImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions (optimized for social media - 1200x630 for OG images)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    // Background gradient - RecordCrate dark chocolate brown theme
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1310');
    gradient.addColorStop(0.5, '#231916');
    gradient.addColorStop(1, '#2d2119');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise texture effect
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(
        Math.random() * width,
        Math.random() * height,
        1,
        1
      );
    }
    ctx.globalAlpha = 1;

    try {
      // Load and draw album cover
      const albumImage = new Image();
      albumImage.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        albumImage.onload = () => resolve();
        albumImage.onerror = () => reject();
        albumImage.src = album.images?.[0]?.url || album.images?.[1]?.url || '';
      });

      // Draw album cover with shadow
      const coverSize = 400;
      const coverX = 60;
      const coverY = (height - coverSize) / 2;

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;

      ctx.drawImage(albumImage, coverX, coverY, coverSize, coverSize);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Content area
      const contentX = coverX + coverSize + 60;
      const contentWidth = width - contentX - 60;
      let currentY = 80;

      // Album name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      const albumName = truncateText(ctx, album.name, contentWidth);
      ctx.fillText(albumName, contentX, currentY);
      currentY += 60;

      // Artist name
      ctx.fillStyle = '#b8b8b8';
      ctx.font = '32px system-ui, -apple-system, sans-serif';
      const artistName = truncateText(ctx, album.artists[0]?.name || 'Unknown Artist', contentWidth);
      ctx.fillText(artistName, contentX, currentY);
      currentY += 70;

      // Rating stars
      const rating = review.overallRating / 20; // Convert 0-100 to 0-5
      drawStars(ctx, contentX, currentY, rating);
      currentY += 60;

      // Rating number
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${rating.toFixed(1)} / 5.0`, contentX, currentY);
      currentY += 60;

      // Review excerpt (if available)
      if (review.writeup && review.writeup.trim()) {
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '24px system-ui, -apple-system, sans-serif';
        const excerpt = truncateText(ctx, `"${review.writeup}"`, contentWidth, 2);
        const lines = wrapText(ctx, excerpt, contentWidth);
        lines.slice(0, 3).forEach(line => {
          ctx.fillText(line, contentX, currentY);
          currentY += 35;
        });
      }

      // Bottom section - User info and branding
      const bottomY = height - 60;
      
      // User name
      ctx.fillStyle = '#a0a0a0';
      ctx.font = '28px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Review by ${userName}`, contentX, bottomY);

      // RecordCrate branding
      ctx.fillStyle = '#e8b968';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      const brandText = 'RecordCrate';
      const brandWidth = ctx.measureText(brandText).width;
      ctx.fillText(brandText, width - brandWidth - 60, bottomY);

      // Convert canvas to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
        setIsGenerating(false);
      }, 'image/png');

    } catch (error) {
      logger.error('Error generating card image:', error);
      setIsGenerating(false);
    }
  };

  const drawStars = (ctx: CanvasRenderingContext2D, x: number, y: number, rating: number) => {
    const starSize = 35;
    const spacing = 45;
    
    for (let i = 0; i < 5; i++) {
      const starX = x + i * spacing;
      const fill = i < Math.floor(rating);
      const partial = i === Math.floor(rating) && rating % 1 !== 0;
      
      ctx.fillStyle = fill || partial ? '#ffd700' : '#444';
      drawStar(ctx, starX, y, starSize / 2);
      
      if (partial) {
        ctx.save();
        ctx.beginPath();
        const partialWidth = (rating % 1) * spacing;
        ctx.rect(starX - starSize / 2, y - starSize / 2, partialWidth, starSize);
        ctx.clip();
        ctx.fillStyle = '#ffd700';
        drawStar(ctx, starX, y, starSize / 2);
        ctx.restore();
      }
    }
  };

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const truncateText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 1
  ): string => {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    return lines.join(' ') + (lines.length >= maxLines && words.length > lines.join(' ').split(' ').length ? '...' : '');
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const handleDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${album.name.replace(/[^a-z0-9]/gi, '_')}_review.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `${album.name}_review.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My review of ${album.name}`,
          text: `Check out my review of ${album.name} by ${album.artists[0]?.name} on RecordCrate!`,
        });
      } else {
        // Fallback: copy image URL or download
        handleDownload();
      }
    } catch (error) {
      logger.error('Error sharing:', error);
      handleDownload();
    }
  };

  const handleCopyLink = () => {
    // Copy a shareable link (you can customize this to your app's URL structure)
    const shareUrl = `${window.location.origin}/album/${album.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="review-share-modal">
      <div className="review-share-overlay" onClick={onClose} />
      <div className="review-share-content">
        <button className="review-share-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <h2>Share Your Review</h2>
        
        <div className="review-share-preview">
          {isGenerating ? (
            <div className="generating-loader">
              <p>Generating shareable image...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Review card" className="review-card-preview" loading="lazy" />
          ) : null}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="review-share-actions">
          <button 
            className="share-action-btn download-btn" 
            onClick={handleDownload}
            disabled={!imageUrl || isGenerating}
          >
            <Download size={20} />
            Download Image
          </button>
          
          <button 
            className="share-action-btn share-btn" 
            onClick={handleShare}
            disabled={!imageUrl || isGenerating}
          >
            <Share2 size={20} />
            Share
          </button>

          <button 
            className="share-action-btn link-btn" 
            onClick={handleCopyLink}
          >
            <Share2 size={20} />
            Copy Link
          </button>
        </div>
      </div>
    </div>
  );
};
