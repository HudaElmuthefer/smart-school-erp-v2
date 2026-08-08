<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /** كل مستخدمي نفس الفرع باستثناء المستخدم الحالي، لاختيار مستلم رسالة */
    public function contacts(Request $request)
    {
        $user = $request->user();

        $contacts = User::where('school_id', $user->school_id)
            ->where('id', '!=', $user->id)
            ->with('role')
            ->orderBy('full_name')
            ->get()
            ->map(fn ($u) => ['id' => $u->id, 'full_name' => $u->full_name, 'role_ar' => $u->role?->name_ar]);

        return response()->json(['contacts' => $contacts]);
    }

    /** قائمة المحادثات: آخر رسالة مع كل طرف + عدد غير المقروء */
    public function inbox(Request $request)
    {
        $user = $request->user();

        $messages = Message::where('sender_id', $user->id)
            ->orWhere('recipient_id', $user->id)
            ->with(['sender:id,full_name', 'recipient:id,full_name'])
            ->orderByDesc('created_at')
            ->get();

        $conversations = $messages
            ->groupBy(fn ($m) => $m->sender_id === $user->id ? $m->recipient_id : $m->sender_id)
            ->map(function ($group, $otherId) use ($user) {
                $last = $group->first();
                $other = $last->sender_id === $user->id ? $last->recipient : $last->sender;
                $unread = $group->where('recipient_id', $user->id)->whereNull('read_at')->count();

                return [
                    'user_id' => (int) $otherId,
                    'full_name' => $other?->full_name,
                    'last_message' => $last->body,
                    'last_at' => $last->created_at,
                    'unread_count' => $unread,
                ];
            })
            ->sortByDesc('last_at')
            ->values();

        return response()->json(['conversations' => $conversations]);
    }

    /** كل الرسائل المتبادلة مع مستخدم معيّن، وتُعلَّم رسائله الواردة كمقروءة */
    public function thread(Request $request, User $user)
    {
        $me = $request->user();
        abort_if($user->school_id !== $me->school_id, 403, 'غير مصرح بالتواصل مع هذا المستخدم');

        Message::where('sender_id', $user->id)
            ->where('recipient_id', $me->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $thread = Message::where(function ($q) use ($me, $user) {
            $q->where('sender_id', $me->id)->where('recipient_id', $user->id);
        })->orWhere(function ($q) use ($me, $user) {
            $q->where('sender_id', $user->id)->where('recipient_id', $me->id);
        })->orderBy('created_at')->get();

        return response()->json(['messages' => $thread]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'body' => ['required', 'string'],
        ]);

        $recipient = User::findOrFail($data['recipient_id']);
        abort_if($recipient->school_id !== $user->school_id, 403, 'غير مصرح بالتواصل مع هذا المستخدم');

        $message = Message::create([
            'school_id' => $user->school_id,
            'sender_id' => $user->id,
            'recipient_id' => $recipient->id,
            'body' => $data['body'],
        ]);

        return response()->json(['message_sent' => $message], 201);
    }
}
