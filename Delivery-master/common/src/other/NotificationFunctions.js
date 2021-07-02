import {
    cloud_function_server_url
} from 'config';

export function RequestPushMsg(token, title, msg) {
    fetch(`${cloud_function_server_url}/send_notification`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json, text/plain, /',  // It can be used to overcome cors errors
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "token": token,
            "title": title,
            "msg": msg
        })
    })
    .then((response) => {
        console.log(response);
    })
    .catch((error) => {
        console.log(error)
    });
}