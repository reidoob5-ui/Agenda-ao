// Reduz a imagem no proprio telemovel (quadrada, JPEG) antes de enviar
export function reduzirImagem(ficheiro, lado = 160) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(ficheiro)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = lado; canvas.height = lado
      const ctx = canvas.getContext('2d')
      const min = Math.min(img.width, img.height)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, lado, lado)
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, lado, lado)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')) }
    img.src = url
  })
}
