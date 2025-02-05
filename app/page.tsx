import Chat from "@/components/Chat";


export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-start justify-items-center min-h-screen p-8 pt-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Chat/>
    </div>
  );
}
