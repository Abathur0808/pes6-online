import { notFound, redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { RoomPanel } from "@/components/room-panel";
import type { Room, RoomMember } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/salas");

  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single<Room>();

  if (!room) notFound();

  const { data: members } = await supabase
    .from("room_members")
    .select("*, profile:profiles(*)")
    .eq("room_id", room.id)
    .order("joined_at");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-sport text-3xl font-bold uppercase tracking-wide">
        {room.name}
      </h1>
      <div className="mt-6">
        <RoomPanel
          room={room}
          members={(members as RoomMember[]) ?? []}
          currentUserId={user?.id ?? null}
        />
      </div>
    </div>
  );
}
