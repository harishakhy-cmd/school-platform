'use strict';

window.renderProfilePhoto = function (image, fallback, photoUrl) {
  if (!image || !fallback) return;
  image.onerror = () => {
    image.hidden = true;
    fallback.hidden = false;
  };
  if (photoUrl) {
    image.src = photoUrl;
    image.hidden = false;
    fallback.hidden = true;
  } else {
    image.removeAttribute('src');
    image.hidden = true;
    fallback.hidden = false;
  }
};

window.uploadProfilePhoto = async function (file, endpoint) {
  if (!file) throw new Error('Choose a photo to upload.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 4 * 1024 * 1024) throw new Error('Profile photos must be 4 MB or smaller.');
  const response = await fetch(endpoint, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': file.type },
    body: file
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
  if (!response.ok || !data.ok) throw new Error(data.error || `Photo upload failed (${response.status}).`);
  return data;
};
