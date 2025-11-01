import React from 'react';
import {
  Disc3,
  Heart,
  PenSquare,
  Star,
  CalendarDays,
  ListMusic,
  Gauge,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type FeatureCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const featureCards: FeatureCard[] = [
  {
    icon: Disc3,
    title: 'Catalog every record',
    description:
      'Log the albums you love, revisit, and discover—RecordCrate keeps your listening history together in one timeline.',
  },
  {
    icon: Heart,
    title: 'Highlight your standouts',
    description:
      'Save favorite releases to a personal showcase so friends can instantly see what you have on repeat.',
  },
  {
    icon: PenSquare,
    title: 'Write thoughtful reviews',
    description:
      'Craft long-form reflections or quick impressions for any album, then revisit your notes as your taste evolves.',
  },
  {
    icon: Star,
    title: 'Score every track',
    description:
      'Use half-star precision to celebrate flawless cuts and flag the skips—each song rating rolls into your album score.',
  },
  {
    icon: CalendarDays,
    title: 'Track release journeys',
    description:
      'Follow artists across eras with timeline views that surface reissues, deluxe editions, and regional pressings.',
  },
  {
    icon: ListMusic,
    title: 'Build shareable lists',
    description:
      'Curate themed crates, seasonal rotations, or essential discographies and publish them in seconds.',
  },
];

export const AboutUs: React.FC = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <span className="eyebrow">About RecordCrate</span>
        <h1>We’re building the home for serious listeners.</h1>
        <p>
          RecordCrate blends deep catalog data with tools built for collectors, DJs, and casual crate diggers alike.
          From the first listen to the hundredth, keep every spin organized and every insight close at hand.
        </p>
      </section>

      <section className="about-cards-section">
        <h2>RecordCrate lets you…</h2>
        <div className="about-card-grid">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <article key={title} className="about-card">
              <div className="about-card-icon" aria-hidden="true">
                <Icon size={28} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-rating-section">
        <div className="rating-section-header">
          <h2>How rating works</h2>
          <p>
            Albums and tracks use connected scales so you can move easily from individual impressions to a holistic score.
          </p>
        </div>
        <div className="rating-grid">
          <article className="rating-card">
            <div className="rating-card-icon" aria-hidden="true">
              <Gauge size={28} />
            </div>
            <h3>Album score (0–100%)</h3>
            <p>
              Dial in a precise percentage with the slider. We color-code each badge so you can spot standouts at a glance.
            </p>
            <ul>
              <li>Move the slider or type to lock in your exact sentiment.</li>
              <li>The percent badge mirrors what you&apos;ll see across the app.</li>
              <li>Revisit and adjust anytime—your notes stay right beside the score.</li>
            </ul>
          </article>

          <article className="rating-card">
            <div className="rating-card-icon" aria-hidden="true">
              <Star size={28} />
            </div>
            <h3>Track ratings (0–5 stars)</h3>
            <p>
              Give each song a rating with half-star precision. It&apos;s perfect for spotlighting deep cuts or calling out
              skippable tracks.
            </p>
            <ul>
              <li>Click or tap for half-star increments when you need nuance.</li>
              <li>Keyboard access lets you keep rating while crate-digging hands-free.</li>
              <li>We average your starred tracks into the album score so both views stay in sync.</li>
            </ul>
          </article>
        </div>
        <div className="rating-note">
          <Sparkles size={18} aria-hidden="true" />
          <p>
            Prefer to start with track ratings? We instantly translate the average into a percent so your album score inherits
            the detail you put into each song—tweak the slider afterward if you want to emphasize vibe over math.
          </p>
        </div>
      </section>
    </div>
  );
};
