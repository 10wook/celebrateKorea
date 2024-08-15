const group1 = document.querySelector("#group1");
const group2 = document.querySelector("#group2");

function radian2degree(radian) {
  return radian * (180 / Math.PI);
}

group1.style.rotate = radian2degree(Math.acos(3 / Math.sqrt(13))) + "deg";
group2.style.rotate = radian2degree(Math.acos(3 / Math.sqrt(13))) * -1 + "deg";