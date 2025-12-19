function hashString(str){
  // 간단 해시(결정적) - 제출용으로 충분
  let h = 2166136261;
  for (let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function pickByHash(arr, h){
  if (!arr || arr.length === 0) return null;
  return arr[h % arr.length];
}

// 학번 -> { faculty, major }
window.pickMajorFromStudentId = function(studentId){
  const id = String(studentId || "").trim();
  const h = hashString(id || "default");

  const facultyObj = pickByHash(window.MAJORS, h);
  const major = pickByHash(facultyObj.majors, h >>> 1);

  return { faculty: facultyObj.faculty, major };
};
