
function toggleTheme(){
  document.body.classList.toggle("dark");
}

function openTool(id){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function closePanel(){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
}

function comingSoon(name){
  alert(name+" is coming soon!");
}

// IMAGE TO PDF

const input=document.getElementById("imageInput");
const preview=document.getElementById("preview");
const makePDF=document.getElementById("makePDF");
const message=document.getElementById("pdfMessage");
const fileCount=document.getElementById("fileCount");
const pdfName=document.getElementById("pdfName");

let selectedImages=[];

input.addEventListener("change",function(){

  selectedImages=Array.from(input.files);
  preview.innerHTML="";
  message.textContent="";

  selectedImages.forEach(file=>{

    const item=document.createElement("div");
    item.className="preview-item";

    const img=document.createElement("img");
    img.src=URL.createObjectURL(file);

    const name=document.createElement("p");
    name.textContent=file.name;

    item.appendChild(img);
    item.appendChild(name);
    preview.appendChild(item);

  });

  fileCount.textContent=selectedImages.length
    ?selectedImages.length+" image(s) selected"
    :"No images selected";

  makePDF.disabled=selectedImages.length===0;

});

async function createPDF(){

  if(selectedImages.length===0)return;

  if(!window.jspdf){
    message.textContent="PDF library failed to load. Check internet connection.";
    return;
  }

  let filename=pdfName.value.trim();

  if(!filename){
    message.textContent="Please enter a PDF file name.";
    pdfName.focus();
    return;
  }

  filename=filename.replace(/[\\/:*?"<>|]/g,"-");
  filename=filename.replace(/\.pdf$/i,"");

  if(!filename){
    message.textContent="Please enter a valid file name.";
    return;
  }

  makePDF.disabled=true;
  message.textContent="Creating PDF...";

  try{

    const {jsPDF}=window.jspdf;
    let pdf=null;

    for(let i=0;i<selectedImages.length;i++){

      const file=selectedImages[i];
      const data=await readImage(file);

      const img=new Image();
      img.src=data;

      await new Promise((resolve,reject)=>{
        img.onload=resolve;
        img.onerror=reject;
      });

      const orientation=img.width>img.height
        ?"landscape"
        :"portrait";

      if(!pdf){
        pdf=new jsPDF({
          orientation:orientation,
          unit:"mm",
          format:"a4"
        });
      }else{
        pdf.addPage("a4",orientation);
      }

      const pageWidth=pdf.internal.pageSize.getWidth();
      const pageHeight=pdf.internal.pageSize.getHeight();

      const margin=10;
      const maxWidth=pageWidth-margin*2;
      const maxHeight=pageHeight-margin*2;

      const ratio=Math.min(
        maxWidth/img.width,
        maxHeight/img.height
      );

      const width=img.width*ratio;
      const height=img.height*ratio;

      const canvas=document.createElement("canvas");
      canvas.width=img.width;
      canvas.height=img.height;

      const ctx=canvas.getContext("2d");

      ctx.fillStyle="#ffffff";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);

      const jpegData=canvas.toDataURL("image/jpeg",0.92);

      pdf.addImage(
        jpegData,
        "JPEG",
        (pageWidth-width)/2,
        (pageHeight-height)/2,
        width,
        height
      );

    }

    pdf.save(filename+".pdf");

    message.textContent="✓ "+filename+".pdf created successfully!";

  }catch(error){

    message.textContent="Could not create PDF. Try another image.";

  }finally{

    makePDF.disabled=selectedImages.length===0;

  }

}

function readImage(file){

  return new Promise((resolve,reject)=>{

    const reader=new FileReader();

    reader.onload=()=>resolve(reader.result);
    reader.onerror=reject;

    reader.readAsDataURL(file);

  });

}

// QR CODE GENERATOR

let generatedQRCanvas=null;

async function generateQR(){

  const text=document.getElementById("qrText").value.trim();

  const result=document.getElementById("qrResult");
  const status=document.getElementById("qrMessage");
  const download=document.getElementById("downloadQR");

  result.innerHTML="";
  status.textContent="";
  download.disabled=true;
  generatedQRCanvas=null;

  if(!text){
    status.textContent="Please enter text or a URL first.";
    return;
  }

  if(!window.QRCode || !QRCode.toCanvas){
    status.textContent="QR library failed to load. Check internet connection.";
    return;
  }

  try{

    const canvas=document.createElement("canvas");

    await QRCode.toCanvas(canvas,text,{
      width:260,
      margin:2,
      errorCorrectionLevel:"M",
      color:{
        dark:"#000000",
        light:"#ffffff"
      }
    });

    result.appendChild(canvas);

    generatedQRCanvas=canvas;
    download.disabled=false;

    status.textContent="QR code generated successfully!";

  }catch(error){

    status.textContent="Unable to create QR code. Try shorter text.";

  }

}

function downloadQR(){

  if(!generatedQRCanvas)return;

  const link=document.createElement("a");

  link.download="Smart-Tools-QR.png";
  link.href=generatedQRCanvas.toDataURL("image/png");

  link.click();

}
