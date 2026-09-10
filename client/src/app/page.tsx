"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { ArrowUpRight, ServiceIcon } from "@/components/ServiceIcon";

const services = [
  { id: "car", tag: "FOUR WHEELS. ENDLESS POSSIBILITIES.", title: "Rent a car", description: "A daily commute or a weekend away. Find a car that fits your plans.", image: "/images/car-rental.jpg", alt: "Silver sports car outside a vehicle showroom", action: "Find a car" },
  { id: "bike", tag: "LESS TRAFFIC. MORE FREEDOM.", title: "Rent a bike", description: "Make everyday journeys easier. Explore bikes for your next ride.", image: "/images/bike-rental.jpg", alt: "Helmeted motorcyclist riding along an open road at sunset", action: "Find a bike" },
  { id: "finance", tag: "A LITTLE SUPPORT. A BIG NEXT STEP.", title: "Explore finance", description: "Compare available loan offers and find support for your next step.", image: "/images/finance.jpg", alt: "People reviewing financial documents together", action: "View finance offers" }
] as const;

export default function HomePage() {
  const { setMode } = useMode();
  const { user } = useAuth();
  const [heroService, setHeroService] = useState<"car" | "bike" | "finance">("car");
  const heroImage = services.find((service) => service.id === heroService)!;
  const customerHref = user ? `/${user.role}/dashboard` : "/auth/buyer/sign-up";
  const partnerHref = user ? `/${user.role}/dashboard` : "/auth/lister/sign-up";

  function chooseService(service: "car" | "bike" | "finance") {
    setMode(service === "finance" ? "finance" : "rental");
    if (service !== "finance") window.sessionStorage.setItem("uniqart_vehicle_type", service);
  }

  return (
    <main id="main-content" className="home-page">
      <section className="home-shell hero-wrap" aria-labelledby="hero-title">
        <div className="home-hero">
          <Image key={heroService} src={heroImage.image} alt={heroImage.alt} fill priority sizes="(max-width: 1280px) 100vw, 1280px" className="hero-photo" />
          <div className="hero-shade" />
          <div className="hero-content">
            <p className="hero-eyebrow"><span /> CAR RENTALS · BIKE RENTALS · FINANCE</p>
            <h1 id="hero-title">Your next move.<br /><span>Made simple.</span></h1>
            <p className="hero-description">Rent a car. Ride a bike. Explore finance.<br />One place to get you where you want to be.</p>
            <div className="hero-actions">
              <a href="#services" className="home-button home-button-orange">Find your ride <ArrowUpRight /></a>
              <a href="#finance" className="home-button home-button-glass">Explore finance <ArrowUpRight /></a>
            </div>
            <div className="hero-note"><span className="small-check">✓</span> Simple choices. Clear next steps.</div>
          </div>
          <div className="hero-switcher" role="group" aria-label="Explore service wallpapers">
            {services.map((service, index) => <button key={service.id} type="button" aria-pressed={heroService === service.id} onClick={() => setHeroService(service.id)}><span>0{index + 1}</span>{service.id === "car" ? "Cars" : service.id === "bike" ? "Bikes" : "Finance"}<span className="hero-switch-indicator" /></button>)}
          </div>
        </div>
        <div className="benefit-strip">
          <div><ServiceIcon type="car" /><span>Cars & bikes<span>For everyday and getaways</span></span></div>
          <div><ServiceIcon type="finance" /><span>Finance options<span>Explore offers in one place</span></span></div>
          <div><ServiceIcon type="check" /><span>Reviewed listings<span>Approved before they go live</span></span></div>
        </div>
      </section>

      <section id="services" className="home-shell services-section" aria-labelledby="services-title">
        <div className="section-heading"><div><p className="section-eyebrow">WHAT ARE YOU LOOKING FOR?</p><h2 id="services-title">One place. Three ways forward.</h2></div><p>Choose what you need.<br />We’ll help you take the next step.</p></div>
        <div className="service-grid">
          {services.map((service) => (
            <article key={service.id} id={service.id === "finance" ? "finance" : undefined} className={`service-card service-${service.id}`}>
              <div className="service-image"><Image src={service.image} alt={service.alt} fill sizes="(max-width: 700px) 100vw, 33vw" /><span className="service-image-label"><ServiceIcon type={service.id} />{service.id === "finance" ? "Finance" : service.id === "car" ? "Car rentals" : "Bike rentals"}</span></div>
              <div className="service-body"><p className="service-tag">{service.tag}</p><h3>{service.title}</h3><p className="service-description">{service.description}</p><Link href={customerHref} onClick={() => chooseService(service.id)} className="service-link">{service.action}<ArrowUpRight /></Link></div>
            </article>
          ))}
        </div>
        {!user && <p className="account-note">Create one account to rent vehicles and explore finance. Already a member? <Link href="/auth/buyer/sign-in">Sign in <span aria-hidden="true">↗</span></Link></p>}
      </section>

      <section id="how-it-works" className="how-section" aria-labelledby="how-title">
        <div className="home-shell how-layout"><div><p className="section-eyebrow">NO COMPLICATIONS</p><h2 id="how-title">From “I need”<br />to “let’s go.”</h2><p className="how-intro">Getting started takes just<br className="desktop-break" /> three simple steps.</p></div><ol className="steps-list">
          <li><span className="step-number">01</span><div><h3>Choose your service</h3><p>Pick a car, a bike, or a finance offer.</p></div></li>
          <li><span className="step-number">02</span><div><h3>Find your fit</h3><p>Create an account, explore listings, and review the details and terms.</p></div></li>
          <li><span className="step-number">03</span><div><h3>Send your request</h3><p>Request a booking or apply for finance. Track approval in your account.</p></div></li>
        </ol></div>
      </section>

      <section id="partners" className="home-shell partner-section" aria-labelledby="partner-title"><div className="partner-banner"><div className="partner-icon"><ServiceIcon type="key" /></div><div className="partner-copy"><p className="section-eyebrow">PUT YOUR OPPORTUNITIES TO WORK</p><h2 id="partner-title">Have a vehicle to rent out?</h2><p>List your car or bike, or join as a finance provider.</p></div><div className="partner-actions"><Link className="home-button home-button-dark" href={partnerHref}>Become a partner <ArrowUpRight /></Link>{!user && <Link href="/auth/lister/sign-in" className="partner-signin">Already a partner? Sign in</Link>}</div></div></section>

      <section className="home-shell faq-section" aria-labelledby="faq-title"><div><p className="section-eyebrow">A LITTLE CLARITY</p><h2 id="faq-title">Good questions.<br />Simple answers.</h2></div><div className="faq-list">
        <details><summary>What can I do on MyUniQart?<span aria-hidden="true">+</span></summary><p>You can rent a car or bike, explore finance offers, or register as a partner to list vehicles and offer finance.</p></details>
        <details><summary>How do I rent a vehicle?<span aria-hidden="true">+</span></summary><p>Choose car or bike rentals and create an account. Filter available vehicles, review the price and terms, and submit a booking with your pickup and return dates. You can track the request in your account.</p></details>
        <details><summary>How do finance requests work?<span aria-hidden="true">+</span></summary><p>Create an account to view approved finance offers. Review each offer’s interest rate, repayment terms, and requirements before applying. Submitting a request does not guarantee approval.</p></details>
        <details><summary>Can I list my own vehicle?<span aria-hidden="true">+</span></summary><p>Yes. Choose “Become a partner” to create a partner account and submit your vehicle details. Listings are reviewed before they become available to customers.</p></details>
      </div></section>

      <footer className="home-footer"><div className="home-shell"><div className="footer-top"><div><Link href="/" className="brand-lockup"><span className="brand-mark">u<span>↗</span></span>MyUniQart<span className="brand-dot">.</span></Link><p>Your ride. Your plans. Your next step.</p></div><nav aria-label="Footer navigation"><a href="#services">Rent a vehicle</a><a href="#finance">Finance</a><a href="#partners">Become a partner</a><a href="#how-it-works">How it works</a></nav></div><div className="footer-bottom"><p>© {new Date().getFullYear()} MyUniQart. All rights reserved.</p><p>Vehicle rentals & finance, made simple.</p><Link href="/admin/login" className="admin-footer-link">Admin login <span aria-hidden="true">↗</span></Link></div></div></footer>
    </main>
  );
}

