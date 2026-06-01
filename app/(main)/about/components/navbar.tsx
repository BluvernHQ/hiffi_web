import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="about-navbar mx-40 flex items-center justify-between mt-8 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center space-x-2">
        <Image
          src="/appbarlogo.png"
          width={100}
          height={32}
          alt="Logo"
          className="h-8"
        />
      </div>
      <ul className="flex space-x-4">
        <li>
          <a href="/" className="hover:underline">
            Home
          </a>
        </li>
        <li>
          <a href="/about" className="hover:underline">
            About
          </a>
        </li>
        <li>
          <a href="/contact" className="hover:underline">
            Contact
          </a>
        </li>
      </ul>
    </nav>
  );
}
