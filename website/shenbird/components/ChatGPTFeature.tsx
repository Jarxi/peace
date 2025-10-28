import React from 'react';
import Image from 'next/image';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { LogoIcon } from './icons/LogoIcon';

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-text-secondary" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);


const ChatGPTFeature: React.FC = () => {
  return (
    <section id="product" className="py-24 sm:py-32 bg-gradient-to-b from-white via-brand-peach/20 to-white overflow-hidden isolate relative">
       <div
        className="absolute inset-0 bg-[radial-gradient(#E93D0A15_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]">
      </div>
      <div
        className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 rounded-full blur-3xl"
      ></div>
      <div
        className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-brand-accent/10 to-brand-peach/30 rounded-full blur-3xl"
      ></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 lg:gap-24 lg:items-center">
          
          {/* Text Content */}
          <div className="relative z-10 text-center lg:text-left">
            <p className="font-semibold text-brand-primary uppercase tracking-wider">Conversational Commerce</p>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-text-primary tracking-tight">
              Sell Directly Inside ChatGPT
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-brand-text-secondary max-w-xl mx-auto lg:mx-0">
              Transform conversations into conversions. With Shenbird, your customers can browse, select, and purchase products directly within their ChatGPT session — no redirects, no friction, just a seamless path to checkout.
            </p>
            <div className="mt-8 flex gap-4 justify-center lg:justify-start">
               <a href="#demo" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-brand-primary hover:bg-brand-primary-dark transition-all duration-300 shadow-2xl shadow-brand-primary/30 transform hover:scale-105 hover:shadow-brand-primary/50">
                See it in Action
              </a>
            </div>
          </div>
          
          {/* Chat UI Mockup */}
          <div className="mt-12 lg:mt-0" aria-hidden="true">
            <div className="bg-white border-2 border-brand-border rounded-3xl shadow-2xl shadow-brand-primary/20 p-4 sm:p-6 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-brand-accent/20 to-brand-peach/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col space-y-4">
                
                {/* User Message */}
                <div className="flex items-start gap-3 justify-end">
                    <div className="bg-brand-primary text-white p-4 rounded-2xl rounded-br-none max-w-xs sm:max-w-sm shadow-lg">
                        <p className="text-sm">I&apos;m looking for a warm jacket for hiking.</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center shadow-md">
                        <UserIcon />
                    </div>
                </div>

                {/* Bot Message */}
                <div className="flex items-start gap-3">
                     <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <LogoIcon className="w-8 h-auto" />
                    </div>
                    <div className="bg-brand-peach/50 p-4 rounded-2xl rounded-bl-none max-w-xs sm:max-w-sm shadow-lg border border-brand-border">
                        <p className="text-sm text-brand-text-secondary">Of course! Here&apos;s our top-rated option, the &quot;Summit Pro Down Jacket&quot;. It&apos;s perfect for cold conditions.</p>
                    </div>
                </div>

                {/* Product Card Message */}
                <div className="flex items-start gap-3">
                     <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <LogoIcon className="w-8 h-auto" />
                    </div>
                    <div className="bg-white border-2 border-brand-border rounded-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-primary/20 hover:border-brand-primary/30">
                        <Image src="https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3" alt="Summit Pro Down Jacket" width={800} height={160} className="w-full h-40 object-cover" />
                        <div className="p-4">
                            <h4 className="font-bold text-brand-text-primary">Summit Pro Down Jacket</h4>
                            <p className="text-sm text-brand-text-secondary mt-1">Water-resistant, 800-fill goose down.</p>
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-xl font-bold text-brand-primary">$299.99</p>
                                <button className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white text-sm font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl hover:shadow-brand-primary/30">
                                    <ShoppingCartIcon className="w-4 h-4" />
                                    Buy Now
                                 </button>
                            </div>
                        </div>
                    </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatGPTFeature;