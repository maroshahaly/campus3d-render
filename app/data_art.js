/* بلاصة محايدة (Placeholder) لحد ما توصل صورة النوع الحقيقية — أيقونة عامة، مش رسم لشكل السمكة. */
function artSvg(id, h, cls) {
  return '<svg class="fart ' + (cls || '') + ' h' + h + '" viewBox="0 0 64 64" role="img" aria-label="جارٍ تحميل صورة النوع">' +
    '<circle class="ph-dot" cx="32" cy="32" r="3"/><circle class="ph-dot d1" cx="20" cy="32" r="3"/><circle class="ph-dot d2" cx="44" cy="32" r="3"/></svg>';
}
