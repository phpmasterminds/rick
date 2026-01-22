'use client';
import Link from 'next/link';
import styles from './about.module.css';

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles['hero-container']}>
          <div className={styles['hero-content']}>
            <h1>Pioneering Cannabis Solutions Since the Late 90s</h1>
            <p className={styles['hero-subtitle']}>
              We&apos;re not new to this industry—we&apos;ve been here from the
              beginning, evolving alongside cannabis legalization and helping
              businesses thrive through every stage of growth.
            </p>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className={styles.story}>
        <div className={styles['story-container']}>
          <span className={styles['section-tag']}>Our Story</span>
          <h2>Decades of Cannabis Industry Innovation</h2>

          <div className={styles['story-content']}>
            <p>
              Our journey began in the late 1990s as innovators and pioneers in
              the cannabis community. We operated one of the most popular global
              grow forums, building a vibrant community of thousands of members
              who shared knowledge, techniques, and passion for cannabis
              cultivation.
            </p>

            <p>
              During those early years, we dedicated ourselves to education and
              empowerment. We personally taught hundreds of medical patients how
              to maintain their health through cannabis, providing guidance on
              safe cultivation, responsible usage, and therapeutic applications.
            </p>

            <p>
              As the industry evolved from underground communities to legitimate
              businesses, we evolved with it. We recognized the need for
              professional support services and began developing solutions
              specifically designed for the legal cannabis marketplace.
            </p>
          </div>

          <div className={styles['highlight-box']}>
            <p>
              We promote safe and responsible cannabis usage while helping
              businesses navigate the complex, ever-changing regulatory
              landscape of the legal cannabis industry.
            </p>
          </div>

          <div className={styles['story-content']}>
            <p>
              Over the years, we&apos;ve continued to innovate and expand our
              expertise. We developed METRC-compliant POS systems, built
              sophisticated CRM platforms, and created compliant e-commerce
              solutions for cannabis retailers.
            </p>

            <p>
              Now, with our wholesale marketplace, we&apos;re bringing together
              everything we&apos;ve learned over decades of cannabis industry
              experience. We understand the challenges because we&apos;ve lived
              through them—and we&apos;re committed to helping others succeed.
            </p>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className={styles.timeline}>
        <div className={styles['timeline-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>Our Journey</span>
            <h2>Evolution Through the Years</h2>
            <p className={styles['section-description']}>
              From pioneering online cannabis communities to building modern B2B
              marketplace solutions.
            </p>
          </div>

          <div className={styles['timeline-items']}>
            <div className={styles['timeline-item']}>
              <div className={styles['timeline-year']}>Late 1990s</div>
              <div className={styles['timeline-title']}>The Beginning</div>
              <div className={styles['timeline-description']}>
                Launched one of the internet&apos;s first global cannabis grow
                forums.
              </div>
            </div>

            <div className={styles['timeline-item']}>
              <div className={styles['timeline-year']}>Early 2000s</div>
              <div className={styles['timeline-title']}>Patient Education</div>
              <div className={styles['timeline-description']}>
                Provided hands-on education to hundreds of medical cannabis
                patients.
              </div>
            </div>

            <div className={styles['timeline-item']}>
              <div className={styles['timeline-year']}>2010s</div>
              <div className={styles['timeline-title']}>Business Solutions</div>
              <div className={styles['timeline-description']}>
                Developed METRC-compliant POS systems and CRM platforms.
              </div>
            </div>

            <div className={styles['timeline-item']}>
              <div className={styles['timeline-year']}>2015–2020</div>
              <div className={styles['timeline-title']}>
                E-Commerce Innovation
              </div>
              <div className={styles['timeline-description']}>
                Built compliant e-commerce solutions for cannabis retailers.
              </div>
            </div>

            <div className={styles['timeline-item']}>
              <div className={styles['timeline-year']}>2025</div>
              <div className={styles['timeline-title']}>
                Wholesale Marketplace Launch
              </div>
              <div className={styles['timeline-description']}>
                Launched Nature&apos;s High B2B wholesale marketplace.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className={styles.values}>
        <div className={styles['values-container']}>
          <div className={styles['section-header']}>
            <span className={styles['section-tag']}>Our Values</span>
            <h2>What Drives Us</h2>
            <p className={styles['section-description']}>
              The principles that have guided us since the beginning.
            </p>
          </div>

          <div className={styles['values-grid']}>
            {[
              ['🌱', 'Education First'],
              ['🛡️', 'Safe & Responsible'],
              ['🚀', 'Continuous Innovation'],
              ['🤝', 'Community Support'],
              ['💡', 'Practical Solutions'],
              ['⚖️', 'Regulatory Excellence'],
            ].map(([icon, title]) => (
              <div key={title} className={styles['value-card']}>
                <div className={styles['value-icon']}>{icon}</div>
                <div className={styles['value-title']}>{title}</div>
                <div className={styles['value-description']}>
                  {/* text unchanged in original HTML */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className={styles.mission}>
        <div className={styles['mission-container']}>
          <h2>Our Mission</h2>
          <p className={styles['mission-statement']}>
            &quot;Helping others navigate the ever-changing cannabis industry.&quot;
          </p>
          <p className={styles['mission-text']}>
            This mission has remained constant since the late 1990s. Whether
            we&apos;re operating forums, teaching patients, or building modern
            marketplaces, our purpose is the same.
          </p>
          <p className={styles['mission-text']}>
            We&apos;re industry veterans who&apos;ve dedicated decades to
            cannabis advocacy, education, and innovation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className={styles['cta-section']}>
        <div className={styles['cta-container']}>
          <h2>Join Our Legacy of Innovation</h2>
          <p className={styles['section-description']}>
            Experience the difference that decades of cannabis industry
            expertise makes.
          </p>

          <div className={styles['cta-buttons']}>
            <Link
              href="/register"
              className={`${styles.btn} ${styles['btn-primary']}`}
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className={`${styles.btn} ${styles['btn-secondary']}`}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
