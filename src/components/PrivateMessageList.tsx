import { PRIVATE_REPLY_STANDING_NOTICE } from '../domain/privateThread'
import type { AppRole, PrivateMessage } from '../domain/types'

interface PrivateMessageListProps {
  messages: PrivateMessage[]
  doctorName: string
  /** 보고 있는 쪽. 「나」가 누구인지는 화면마다 다르다. */
  viewerRole: AppRole
}

function formatTime(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

/**
 * 비공개 대화의 말풍선 목록. **환자 화면과 의사 화면이 같은 것을 쓴다.**
 *
 * 고정 고지(D-6 항목 4)가 여기 있어야 하는 이유다. 두 화면이 각자 붙이면 한쪽이
 * 빠져도 아무도 모르고, 「의사가 지울 수 없다」는 두 자리를 다 봐야 확인된다.
 * 고지는 **회신 말풍선 안쪽**에 있어서 인용해도 따라간다.
 */
export function PrivateMessageList({
  messages,
  doctorName,
  viewerRole,
}: PrivateMessageListProps) {
  const nameOf = (role: AppRole) => {
    if (role === viewerRole) return '나'
    return role === 'doctor' ? `${doctorName} 의사` : '환자'
  }

  return (
    <ol className="private-thread-log">
      {messages.map((message) => (
        <li
          key={message.id}
          className={`private-bubble is-${message.senderRole}`}
          data-testid={`private-bubble-${message.senderRole}`}
        >
          <span className="private-bubble-who">{nameOf(message.senderRole)}</span>
          <p className="private-bubble-body">{message.body}</p>
          {/* 의사 회신에만 붙는다. 지우는 수단을 어느 화면에도 두지 않는다. */}
          {message.senderRole === 'doctor' && (
            <p className="private-standing-notice">{PRIVATE_REPLY_STANDING_NOTICE}</p>
          )}
          <time className="private-bubble-time" dateTime={message.createdAt}>
            {formatTime(message.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  )
}
