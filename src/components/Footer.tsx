import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Flame className="h-6 w-6 text-orange-400" />
              <span className="text-xl font-bold text-white">Que-Munity</span>
            </div>
            <p className="text-gray-400">
              The ultimate destination for BBQ enthusiasts worldwide.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">QueMunity</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/recipes" className="hover:text-white transition-colors">Recipes</Link></li>
              <li><Link href="/community/forum" className="hover:text-white transition-colors">Forums</Link></li>
              <li><Link href="/community" className="hover:text-white transition-colors">Events</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/guides" className="hover:text-white transition-colors">Guides</Link></li>
              <li><Link href="/tools" className="hover:text-white transition-colors">Tools</Link></li>
              <li><Link href="/recipes/create" className="hover:text-white transition-colors">Submit Recipe</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Que-Munity. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
