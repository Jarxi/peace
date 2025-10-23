import React from 'react';
import { PeaceLogo, UserCircleIcon } from './icons';

const NavLink: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <button
        onClick={() => alert('This feature is currently under development.')}
        className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
    >
        {children}
    </button>
);

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-3 flex-shrink-0" href="#">
              <PeaceLogo className="h-8 w-auto" />
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Peace Merchant Platform
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-6">
                <NavLink>ACP Report</NavLink>
                <NavLink>AEO</NavLink>
                <NavLink>About</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
                <UserCircleIcon className="h-10 w-10 text-gray-500"/>
                <div className="text-sm">
                    <p className="font-semibold text-slate-800">John Doe</p>
                    <p className="text-slate-500">Administrator</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;