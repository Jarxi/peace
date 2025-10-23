import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

const Footer: React.FC = () => {
  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Integrations", href: "#integrations" },
      { name: "Updates", href: "#updates" },
    ],
    Company: [
      { name: "About", href: "#about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "#careers" },
      { name: "Contact", href: "/contact" },
    ],
    Legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer id="about" className="bg-brand-surface text-brand-text-secondary">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
                <a href="#" className="flex items-center space-x-2">
                    <LogoIcon className="h-8 w-auto" />
                    <span className="font-bold text-2xl text-brand-text-primary">Peace ai</span>
                </a>
                <p className="mt-4 text-sm">The first end-to-end Conversational Commerce platform.</p>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
                <div key={title}>
                    <h3 className="text-sm font-semibold text-brand-text-primary tracking-wider uppercase">{title}</h3>
                    <ul className="mt-4 space-y-2">
                        {links.map((link) => (
                            <li key={link.name}>
                                <a href={link.href} className="text-base hover:text-brand-primary transition-colors duration-200">{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        <div className="mt-12 border-t border-brand-border pt-8 flex flex-col sm:flex-row items-center justify-between">
            <p className="text-base">&copy; {new Date().getFullYear()} Peace ai, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;