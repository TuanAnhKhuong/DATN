import React, { useState, useRef, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';

const WELCOME_MSG = {
    role: 'model',
    text: 'Xin chào! Tôi là **Trợ lý AI Kho hàng** 🤖\n\nTôi có thể truy vấn **dữ liệu thực từ cơ sở dữ liệu** để trả lời câu hỏi của bạn về:\n- 📦 Tồn kho sản phẩm\n- ⚠️ Hàng sắp hết / hết hàng\n- 📋 Phiếu nhập / xuất kho\n- 📊 Thống kê tổng quan\n- 🏭 Thông tin nhà cung cấp\n\nHãy hỏi tôi bất cứ điều gì!',
};

const QUICK_SUGGESTIONS = [
    { icon: '📊', text: 'Tổng quan kho hàng?' },
    { icon: '⚠️', text: 'Hàng nào sắp hết?' },
    { icon: '🚫', text: 'Sản phẩm nào đang hết hàng?' },
    { icon: '📋', text: 'Phiếu nhập hôm nay?' },
    { icon: '📤', text: 'Phiếu xuất tháng này?' },
    { icon: '🏆', text: 'Top 5 sản phẩm tồn kho nhiều nhất?' },
    { icon: '🏭', text: 'Danh sách nhà cung cấp đang hoạt động?' },
];

// ============================================================
// Markdown renderer đơn giản (không cần thư viện ngoài)
// ============================================================
const renderMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Table
        if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
            const tableLines = [];
            while (i < lines.length && lines[i].includes('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            const headers = tableLines[0]
                .split('|')
                .filter((h) => h.trim())
                .map((h) => h.trim());
            const rows = tableLines.slice(2).map((row) =>
                row
                    .split('|')
                    .filter((c) => c.trim())
                    .map((c) => c.trim()),
            );
            elements.push(
                <div key={`table-${i}`} style={{ overflowX: 'auto', margin: '8px 0' }}>
                    <table
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: 13,
                            borderRadius: 8,
                            overflow: 'hidden',
                        }}
                    >
                        <thead>
                            <tr>
                                {headers.map((h, idx) => (
                                    <th
                                        key={idx}
                                        style={{
                                            background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                                            color: '#fff',
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rIdx) => (
                                <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                                    {row.map((cell, cIdx) => (
                                        <td
                                            key={cIdx}
                                            style={{
                                                padding: '7px 12px',
                                                borderBottom: '1px solid #e8edf4',
                                                color: '#334155',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>,
            );
            continue;
        }

        // Heading ##
        if (line.startsWith('## ')) {
            elements.push(
                <h3
                    key={i}
                    style={{ margin: '12px 0 4px', fontSize: 15, fontWeight: 700, color: '#4f46e5' }}
                >
                    {line.slice(3)}
                </h3>,
            );
            i++;
            continue;
        }
        if (line.startsWith('# ')) {
            elements.push(
                <h2
                    key={i}
                    style={{ margin: '12px 0 4px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}
                >
                    {line.slice(2)}
                </h2>,
            );
            i++;
            continue;
        }

        // Bullet list
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const listItems = [];
            while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
                listItems.push(lines[i].slice(2));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {listItems.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 2, color: '#334155', lineHeight: 1.6 }}>
                            {renderInline(item)}
                        </li>
                    ))}
                </ul>,
            );
            continue;
        }

        // Ordered list
        if (/^\d+\.\s/.test(line)) {
            const listItems = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
                listItems.push(lines[i].replace(/^\d+\.\s/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {listItems.map((item, idx) => (
                        <li key={idx} style={{ marginBottom: 2, color: '#334155', lineHeight: 1.6 }}>
                            {renderInline(item)}
                        </li>
                    ))}
                </ol>,
            );
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            elements.push(<br key={i} />);
            i++;
            continue;
        }

        // Normal paragraph
        elements.push(
            <p key={i} style={{ margin: '2px 0', lineHeight: 1.7, color: '#1e293b' }}>
                {renderInline(line)}
            </p>,
        );
        i++;
    }

    return elements;
};

const renderInline = (text) => {
    // Bold **text**
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return (
                <strong key={i} style={{ fontWeight: 700 }}>
                    {part.slice(2, -2)}
                </strong>
            );
        }
        // Italic *text*
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        // Inline code `text`
        if (part.startsWith('`') && part.endsWith('`')) {
            return (
                <code
                    key={i}
                    style={{
                        background: '#f1f5f9',
                        padding: '1px 5px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        color: '#6366f1',
                    }}
                >
                    {part.slice(1, -1)}
                </code>
            );
        }
        return part;
    });
};

const AiChat = () => {
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load lịch sử từ DB khi mở trang
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await axiosClient.get('/chatbot/history');
                const history = response.metadata;
                if (history && history.length > 0) {
                    const mapped = history.map((msg) => ({
                        role: msg.sender === 'bot' ? 'model' : 'user',
                        text: msg.content,
                    }));
                    setMessages([WELCOME_MSG, ...mapped]);
                    setShowSuggestions(false);
                }
            } catch (err) {
                console.warn('Không thể tải lịch sử trò chuyện:', err.message);
            } finally {
                setIsLoadingHistory(false);
            }
        };
        loadHistory();
    }, []);

    const handleSend = async (messageText) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        setInput('');
        setShowSuggestions(false);

        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            const contents = newMessages
                .filter((_, i) => i !== 0)
                .map((msg) => ({
                    role: msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.text }],
                }));

            const response = await axiosClient.post('/chatbot', { contents });
            setMessages((prev) => [...prev, { role: 'model', text: response.metadata.text }]);
        } catch (error) {
            console.error('Chat error:', error);
            let displayMessage = 'Xin lỗi, có lỗi xảy ra! Không thể kết nối với AI lúc này.';
            const errMsg = error?.response?.data?.message || error.message || '';
            if (errMsg.includes('Could not load the default credentials') || errMsg.includes('API_KEY')) {
                displayMessage = 'Khóa API chưa được thiết lập. Vui lòng kiểm tra lại GEMINI_API_KEY trong file server/.env!';
            } else if (error?.response?.data?.message) {
                displayMessage = error.response.data.message;
            }
            setMessages((prev) => [...prev, { role: 'model', text: displayMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearHistory = () => {
        setMessages([WELCOME_MSG]);
        setShowSuggestions(true);
    };

    return (
        <div
            className="flex justify-center w-full font-sans"
            style={{ height: 'calc(100vh - 80px)', padding: '16px 24px' }}
        >
            <div
                className="flex flex-col w-full bg-white border border-slate-200/60 overflow-hidden relative"
                style={{ maxWidth: 960, borderRadius: 28, boxShadow: '0 20px 60px -10px rgba(0,0,0,0.08)' }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 32px',
                        borderBottom: '1px solid #f1f5f9',
                        background: '#fff',
                        flexShrink: 0,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center" style={{ gap: 16 }}>
                            <div className="relative">
                                <div
                                    className="flex items-center justify-center"
                                    style={{
                                        width: 52,
                                        height: 52,
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                    }}
                                >
                                    <span style={{ fontSize: 24 }}>🤖</span>
                                </div>
                                <span
                                    style={{
                                        position: 'absolute',
                                        bottom: 2,
                                        right: 2,
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        background: '#22c55e',
                                        border: '2px solid #fff',
                                    }}
                                />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: 20,
                                            fontWeight: 800,
                                            color: '#1e293b',
                                            letterSpacing: '-0.02em',
                                        }}
                                    >
                                        Trợ lý AI Kho hàng
                                    </h2>
                                    {/* Badge DB thực */}
                                    <span
                                        style={{
                                            background: 'linear-gradient(135deg,#10b981,#059669)',
                                            color: '#fff',
                                            fontSize: 11,
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: 20,
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        🗄️ Dữ liệu thực
                                    </span>
                                </div>
                                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                                    Powered by Gemini 2.5 Flash · Kết nối trực tiếp với Database
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearHistory}
                            title="Xóa lịch sử hiển thị"
                            style={{
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: 10,
                                padding: '6px 14px',
                                cursor: 'pointer',
                                fontSize: 13,
                                color: '#64748b',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                            🗑 Xóa
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    className="overflow-y-auto"
                    style={{
                        flex: 1,
                        padding: '24px 32px',
                        background: '#f8fafc',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}
                >
                    {isLoadingHistory ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                                <p style={{ margin: 0, fontWeight: 500 }}>Đang tải lịch sử trò chuyện...</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                }}
                            >
                                {msg.role === 'model' && (
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 2,
                                            boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>🤖</span>
                                    </div>
                                )}
                                <div
                                    style={{
                                        maxWidth: '78%',
                                        padding: '14px 18px',
                                        borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px',
                                        background:
                                            msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#fff',
                                        color: msg.role === 'user' ? '#fff' : '#1e293b',
                                        border: msg.role === 'model' ? '1px solid #e8edf4' : 'none',
                                        boxShadow:
                                            msg.role === 'user'
                                                ? '0 4px 14px rgba(99,102,241,0.35)'
                                                : '0 2px 8px rgba(0,0,0,0.05)',
                                        fontSize: 14.5,
                                        lineHeight: 1.7,
                                        fontWeight: 500,
                                    }}
                                >
                                    {msg.role === 'model' ? (
                                        renderMarkdown(msg.text)
                                    ) : (
                                        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            marginTop: 2,
                                            boxShadow: '0 4px 10px rgba(239,68,68,0.3)',
                                            fontSize: 18,
                                        }}
                                    >
                                        👤
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Quick Suggestions – chỉ hiện khi chưa chat */}
                    {showSuggestions && !isLoadingHistory && (
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 8,
                                marginTop: 4,
                                paddingLeft: 50,
                            }}
                        >
                            {QUICK_SUGGESTIONS.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(s.text)}
                                    style={{
                                        background: '#fff',
                                        border: '1.5px solid #e2e8f0',
                                        borderRadius: 20,
                                        padding: '6px 14px',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#475569',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        transition: 'all 0.18s',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#4f46e5)';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.color = '#475569';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                    }}
                                >
                                    <span>{s.icon}</span>
                                    {s.text}
                                </button>
                            ))}
                        </div>
                    )}

                    {isLoading && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div
                                style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    boxShadow: '0 4px 10px rgba(99,102,241,0.3)',
                                }}
                            >
                                <span style={{ fontSize: 18 }}>🤖</span>
                            </div>
                            <div
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e8edf4',
                                    borderRadius: '4px 20px 20px 20px',
                                    padding: '14px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                }}
                            >
                                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                                    🗄️ Đang truy vấn dữ liệu...
                                </span>
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="animate-bounce"
                                        style={{
                                            width: 7,
                                            height: 7,
                                            borderRadius: '50%',
                                            background: '#6366f1',
                                            animationDelay: `${i * 150}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div
                    style={{
                        padding: '16px 32px 20px',
                        background: '#fff',
                        borderTop: '1px solid #f1f5f9',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            background: '#f8fafc',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: 20,
                            padding: '10px 10px 10px 20px',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Hỏi về tồn kho, phiếu nhập/xuất, sản phẩm sắp hết..."
                            disabled={isLoading || isLoadingHistory}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                fontSize: 15,
                                color: '#334155',
                                fontWeight: 500,
                                fontFamily: 'inherit',
                            }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                border: 'none',
                                background:
                                    input.trim() && !isLoading ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#e2e8f0',
                                color: input.trim() && !isLoading ? '#fff' : '#94a3b8',
                                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(99,102,241,0.4)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                style={{ width: 18, height: 18, marginLeft: 2 }}
                            >
                                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                            </svg>
                        </button>
                    </div>
                    <p
                        style={{
                            margin: '10px 0 0',
                            textAlign: 'center',
                            fontSize: 12,
                            color: '#cbd5e1',
                            fontWeight: 500,
                        }}
                    >
                        🗄️ AI truy vấn dữ liệu thực từ cơ sở dữ liệu · Lịch sử được lưu tự động
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiChat;
