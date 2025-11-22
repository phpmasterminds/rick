"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import styles from "./coming-soon.module.css";

export default function ComingSoonContent() {
  const searchParams = useSearchParams();
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Auto-prefill form from localStorage
  useEffect(() => {
    const storageKey = "nhEarlyAccess";
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && formRef.current) {
        const data = JSON.parse(stored);
        const nameField = formRef.current.elements.namedItem("name") as HTMLInputElement | null;
        const emailField = formRef.current.elements.namedItem("email") as HTMLInputElement | null;
        const brandField = formRef.current.elements.namedItem("brand") as HTMLInputElement | null;
        const roleField = formRef.current.elements.namedItem("role") as HTMLSelectElement | null;
        const marketsField = formRef.current.elements.namedItem("markets") as HTMLInputElement | null;
        
        if (data.name && nameField) nameField.value = data.name;
        if (data.email && emailField) emailField.value = data.email;
        if (data.brand && brandField) brandField.value = data.brand;
        if (data.role && roleField) roleField.value = data.role;
        if (data.markets && marketsField) marketsField.value = data.markets;
      }
    } catch (e) {
      console.warn("Could not read stored form data", e);
    }
  }, []);

  // Show modal if redirected with #success
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowModal(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(formRef.current!);
    const name = formData.get("name");
    const email = formData.get("email");
    const brand = formData.get("brand");
    const role = formData.get("role");
    const markets = formData.get("markets");
    const website = formData.get("website");

    // Validate required fields
    if (!name || !email) {
      toast.error("Please enter a valid name and email.");
      setIsSubmitting(false);
      return;
    }

    // Check honeypot
    if (website !== "") {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, brand, role, markets }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      // Save to localStorage
      try {
        localStorage.setItem(
          "nhEarlyAccess",
          JSON.stringify({ name, email, brand, role, markets })
        );
      } catch (e) {
        console.warn("Could not store form data", e);
      }

      setShowModal(true);
      formRef.current?.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Could not save your information. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img
            src="/natures-high-logo.png"
            alt="Nature's High Logo"
            className={styles.brandLogo}
          />
          <div className={styles.brandName}>Nature's High</div>
        </div>
        <div className={styles.topNav}>
          <div className={styles.topNavPill}>
            <span className={styles.pillDot}></span>
            Coming soon
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Left: Hero content */}
        <section className={styles.hero} aria-label="Overview">
          <h1>
            All-in-one <span className={styles.heroHighlight}>cannabis POS</span>
            <br />
            and marketplace platform.
          </h1>

          <p className={styles.heroSubtitle}>
            Nature's High keeps your register, online ordering, and marketplace listings in sync, so
            your team can focus on customers instead of juggling disconnected tools.
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroFeature}>
              <div className={styles.featureLabel}>Front-of-house</div>
              <div className={styles.featureMain}>
                Fast, budtender-friendly checkout with real-time inventory and built-in purchase
                limits.
              </div>
            </div>
            <div className={styles.heroFeature}>
              <div className={styles.featureLabel}>Online Marketplace</div>
              <div className={styles.featureMain}>
                One menu that feeds your site and marketplaces, with accurate stock and pricing.
              </div>
            </div>
            <div className={styles.heroFeature}>
              <div className={styles.featureLabel}>Compliance</div>
              <div className={styles.featureMain}>
                Med card verification, limits, and exportable reports to keep your operation
                audit-ready.
              </div>
            </div>
            <div className={styles.heroFeature}>
              <div className={styles.featureLabel}>Ecommerce</div>
              <div className={styles.featureMain}>
                Connect with consumers, patients and wholesalers with real-time menus, deals and
                product listings.
              </div>
            </div>
          </div>
        </section>

        {/* Right: Request early access */}
        <aside className={styles.cardWrap} aria-label="Request early access">
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>Request early access</h2>
            <p className={styles.formCaption}>
              Be among the first dispensaries, processors and growers to launch on Nature's High.
            </p>

            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Alex Rivera"
                    className={styles.fieldInput}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="email">Work email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@dispensary.com"
                    className={styles.fieldInput}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brand">Store / brand</label>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    autoComplete="organization"
                    placeholder="Nature's High Dispensary"
                    className={styles.fieldInput}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="role">Role</label>
                  <select id="role" name="role" className={styles.fieldSelect}>
                    <option value="">Select role</option>
                    <option value="owner">Owner / Founder</option>
                    <option value="gm">GM / Store Manager</option>
                    <option value="ops">Operations</option>
                    <option value="it">IT / Systems</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="markets">Markets</label>
                <input
                  id="markets"
                  name="markets"
                  type="text"
                  placeholder="e.g. Oklahoma, Michigan"
                  className={styles.fieldInput}
                />
              </div>

              {/* Honeypot field */}
              <div className={styles.hpField} aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  autoComplete="off"
                  tabIndex={-1}
                  placeholder="Leave this field empty"
                />
              </div>

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Join the waitlist"}
                <span className={styles.icon}>↗</span>
              </button>

              <p className={styles.formFootnote}>
                <strong>No spam.</strong> We'll only contact you about launch timing and onboarding.
              </p>
            </form>
          </div>
        </aside>
      </main>

      <footer className={styles.footer}>
        <div>© {new Date().getFullYear()} Nature's High. All rights reserved.</div>
        <div className={styles.footerLinks}>
          <span>For licensed cannabis businesses only.</span>
        </div>
      </footer>

      {/* Thank-you modal */}
      <div
        ref={modalRef}
        className={showModal ? `${styles.modal} ${styles.visible}` : styles.modal}
        aria-hidden={!showModal}
      >
        <div
          className={styles.modalContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="thankYouTitle"
        >
          <h3 id="thankYouTitle">Thank you!</h3>
          <p>Your early access request has been received. We'll reach out as we get closer to launch.</p>
          <button
            onClick={closeModal}
            className={`${styles.btnPrimary} ${styles.modalBtn}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}