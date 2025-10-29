'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MenuIcon } from './icons/MenuIcon';
import { XIcon } from './icons/XIcon';
import { LogoIcon } from './icons/LogoIcon';
import { SlackIcon } from './icons/SlackIcon';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Product", href: "/#product" },
    { name: "About", href: "/#about" },
    { name: "Blog", href: "/blog" },
  ];

  const slackLink = "https://join.slack.com/t/shumbird/shared_invite/zt-3g1423380-4NtYidQ7XmzwmST5wviCsQ";

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b-2 border-brand-border shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <LogoIcon className="h-6 w-auto" />
              <span className="font-bold text-2xl text-black">Shumbird</span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-brand-text-secondary hover:text-brand-primary transition-colors duration-300 font-medium text-base">
                {link.name}
              </Link>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <a
              href={slackLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-border rounded-md text-sm font-medium text-brand-text-secondary hover:bg-brand-surface hover:text-brand-primary transition-colors"
            >
              <SlackIcon className="h-5 w-5" />
              <span>Join Community</span>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary-dark rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl hover:shadow-brand-primary/30 transition-all duration-300 transform hover:scale-105"
            >
              Login
            </Link>
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-brand-text-secondary hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary">
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b-2 border-brand-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="block px-3 py-2 rounded-lg text-base font-medium text-brand-text-secondary hover:text-brand-primary hover:bg-brand-peach/30">
                {link.name}
              </Link>
            ))}
            <div className="border-t-2 border-brand-border my-2"></div>
            <a
              href={slackLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium text-brand-text-secondary hover:text-brand-primary hover:bg-brand-peach/30"
            >
              <SlackIcon className="h-5 w-5" />
              <span>Join Community</span>
            </a>
            <Link
              href="/login"
              className="flex items-center justify-center gap-3 px-3 py-2 rounded-full text-base font-bold bg-brand-primary text-white shadow-lg"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;