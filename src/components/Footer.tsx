import { Link } from 'react-router-dom';
import { HeartHandshake, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-100 dark:bg-navy-950 dark:border-t dark:border-navy-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <HeartHandshake className="h-6 w-6 text-cta-400" />
              <span>SchoolCare Connect</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-navy-200">
              A transparent donation platform connecting generous donors with students
              who need stationery and school supplies.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-cta-400">
              Quick Links
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/needs" className="hover:text-white transition-colors">School Needs</Link></li>
              <li><Link to="/survey" className="hover:text-white transition-colors">Survey Report</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Donation</Link></li>
              <li><Link to="/signin" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-cta-400">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-navy-300" /> admin@schoolcare.org
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-navy-300" /> +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-navy-300" /> Green Valley, Dist. Pune
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-navy-700 pt-6 text-center text-sm text-navy-300">
          &copy; {new Date().getFullYear()} SchoolCare Connect. Built for transparency in school donations.
        </div>
      </div>
    </footer>
  );
}
