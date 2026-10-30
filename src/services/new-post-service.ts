import {useState, useEffect} from 'react';

function useNewLexicalJson() {
    const [json, setJson] = useState(() =>
        localStorage.getItem('new-post.lexical-json'),
    );
    useEffect(() => {
        if (json) {
            localStorage.setItem('new-post.lexical-json', json);
        }
    }, []);
    return [json, setJson] as const;
}

function useReplyLexicalJson() {
    const [json, setJson] = useState(() =>
        sessionStorage.getItem('reply.lexical-json'),
    );
    useEffect(() => {
        if (json) {
            sessionStorage.setItem('reply.lexical-json', json);
        }
    }, [json]);
    return [json, setJson] as const;
}

export const newPost = {
    useNewLexicalJson,
    useReplyLexicalJson,
};
