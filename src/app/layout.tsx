import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'SIRIUS Writers Studio',description:'Your Words. Your Vision. Your Creative Process. A free creative tool by SIRIUS Entertainment.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
