import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { dismissAnnouncement, isAnnouncementDismissed } from '../utils/customerProfileStorage';
import announcementService from '../services/announcementService';

const BannerWrap = styled.div`
  border-radius: 12px;
  border: 1px solid rgba(14, 116, 144, 0.2);
  background: linear-gradient(135deg, #ecfeff, #f0fdf4);
  color: #0f172a;
  margin: 1rem 0 1.25rem;
  padding: 0.9rem 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 6px 20px rgba(15, 118, 110, 0.08);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
`;

const BannerImage = styled.img`
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 12px;
  flex-shrink: 0;
`;

const BannerText = styled.div`
  flex: 1;
`;

const BannerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
`;

const ActionButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #0f766e;
  color: #fff;
  border-radius: 999px;
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
`;

const DismissButton = styled.button`
  border: 0;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  border-radius: 999px;
  padding: 0.4rem 0.8rem;
  font-weight: 700;
`;

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnnouncement = async () => {
      try {
        const response = await announcementService.getActiveAnnouncements();
        const data = Array.isArray(response?.data) ? response.data : [];
        const active = data[0] || null;
        if (isMounted && active && !isAnnouncementDismissed(`announcement_${active.id}`)) {
          setAnnouncement(active);
        } else if (isMounted) {
          setAnnouncement(null);
        }
      } catch (error) {
        console.warn('Announcement banner fetch failed:', error);
        if (isMounted) setAnnouncement(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !announcement?.message) return null;
  if (isAnnouncementDismissed(`announcement_${announcement.id}`)) return null;

  const dismissKey = `announcement_${announcement.id}`;
  const actionLink = announcement.actionLink ? announcement.actionLink : null;

  return (
    <BannerWrap>
      <BannerContent>
        {announcement.image && <BannerImage src={announcement.image} alt={announcement.title} />}
        <BannerText>
          <strong>{announcement.title || 'Important update'}</strong>
          <div style={{ fontSize: '0.92rem', marginTop: '0.15rem', whiteSpace: 'pre-wrap' }}>{announcement.message}</div>
        </BannerText>
      </BannerContent>
      <BannerActions>
        {announcement.actionText && actionLink && (
          <ActionButton href={actionLink} target={actionLink.startsWith('http') ? '_blank' : undefined} rel={actionLink.startsWith('http') ? 'noopener noreferrer' : undefined}>
            {announcement.actionText}
          </ActionButton>
        )}
        <DismissButton type="button" onClick={() => dismissAnnouncement(dismissKey)}>Dismiss</DismissButton>
      </BannerActions>
    </BannerWrap>
  );
};

export default AnnouncementBanner;
