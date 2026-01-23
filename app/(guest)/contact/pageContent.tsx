'use client';

import styles from './contact.module.css';

export default function ContactPage() {
  return (
    <>
		{/* HERO */}
		<section className={styles.hero}>
			<div className={styles['hero-container']}>
			  <h1>Get in Touch</h1>
			  <p className={styles['hero-subtitle']}>
				Have questions about our platform? Want to discuss custom solutions?
				We&apos;re here to help your cannabis business succeed.
			  </p>
			</div>
		</section>

		{/* CONTACT SECTION */}
		<section className={styles['contact-section']}>
			<div className={styles['contact-container']}>
				{/* CONTACT INFO */}
				<div className={styles['contact-info']}>
					<h2>Contact Information</h2>
					<p>
					  Reach out to our team and we&apos;ll respond as quickly as possible.
					  We&apos;re committed to supporting your success in the cannabis
					  industry.
					</p>

					<div className={styles['info-item']}>
					  <div className={styles['info-icon']}>📧</div>
					  <div className={styles['info-content']}>
						<h3>Email</h3>
						<p>
						  <a href="mailto:info@natureshigh.com">
							info@natureshigh.com
						  </a>
						</p>
					  </div>
					</div>
				</div>
            
				{/* CONTACT FORM */}
				<div className={styles['contact-form']}>
					<h2>Send Us a Message</h2>

					<form id="contactForm" action="#" method="POST">
						<div className={styles['form-row']}>
							<div className={styles['form-group']}>
							  <label htmlFor="firstName">First Name *</label>
							  <input
								type="text"
								id="firstName"
								name="firstName"
								required
							  />
							</div>

							<div className={styles['form-group']}>
							  <label htmlFor="lastName">Last Name *</label>
							  <input
								type="text"
								id="lastName"
								name="lastName"
								required
							  />
							</div>
						</div>

						<div className={styles['form-row']}>
							<div className={styles['form-group']}>
							  <label htmlFor="email">Email Address *</label>
							  <input type="email" id="email" name="email" required />
							</div>

							<div className={styles['form-group']}>
							  <label htmlFor="phone">Phone Number</label>
							  <input type="tel" id="phone" name="phone" />
							</div>
						</div>

						<div className={styles['form-group']}>
							<label htmlFor="company">Company Name</label>
							<input type="text" id="company" name="company" />
						</div>

						<div className={styles['form-group']}>
							<label htmlFor="userType">I am a *</label>
							<select id="userType" name="userType" required>
							  <option value="">Select an option</option>
							  <option value="brand">Cannabis Brand/Wholesaler</option>
							  <option value="retailer">Dispensary/Retailer</option>
							  <option value="other">Other</option>
							</select>
						</div>

						<div className={styles['form-group']}>
							<label htmlFor="subject">Subject *</label>
							<input type="text" id="subject" name="subject" required />
						</div>

						<div className={styles['form-group']}>
							<label htmlFor="message">Message *</label>
							<textarea id="message" name="message" required />
						</div>

						<button
						type="submit"
						className={styles['btn-submit']}
						>
						Send Message
						</button>
					</form>
				</div>
			</div>
		</section>
    </>
  );
}
