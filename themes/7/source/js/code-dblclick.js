
document.addEventListener('DOMContentLoaded', function () {
  var content = document.querySelector('.post-content');
  if (!content) return;

  function selectNode(node) {
    var range = document.createRange();
    var selection = window.getSelection();
    range.selectNodeContents(node);
    selection.removeAllRanges(); 
    selection.addRange(range);   
  }

  content.addEventListener('dblclick', function (e) {
    var codeCell = e.target.closest('.highlight td.code');
    if (codeCell) {
      selectNode(codeCell);
      return;
    }
    var pre = e.target.closest('pre');
    if (pre && !pre.closest('.gutter')) {
      selectNode(pre);
    }
  });
});
