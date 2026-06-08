import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { put } from '@vercel/blob';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Type de fichier invalide. Seuls les images et PDF sont acceptés.' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, message: 'File too large. Maximum size is 5MB.' }, { status: 400 });
    }

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${uniqueSuffix}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // ✅ Remplacé : écriture locale au lieu de Vercel Blob
    // const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    // await mkdir(uploadDir, { recursive: true });
    // const buffer = Buffer.from(await file.arrayBuffer());
    // await writeFile(path.join(uploadDir, filename), buffer);

    let url: string;

    if (process.env.STORAGE === 'vercel') {
      // Production : Vercel Blob
      const blob = await put(filename, buffer, { access: 'public' });
      url = blob.url;
    } else {
      // Local : public/uploads
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({ success: true, url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ success: false, message: 'Error saving file' }, { status: 500 });
  }
}

// import { NextResponse } from 'next/server';
// import { put } from '@vercel/blob';

// export async function POST(request: Request) {
//   try {
//     const data = await request.formData();
//     const file: File | null = data.get('file') as unknown as File;

//     if (!file) {
//       return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
//     }

//     // Validate file type
//     const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
//     if (!allowedTypes.includes(file.type)) {
//       return NextResponse.json({ success: false, message: 'Type de fichier invalide. Seuls les images et PDF sont acceptés.' }, { status: 400 });
//     }

//     // Validate file size (max 5MB)
//     const maxSize = 5 * 1024 * 1024;
//     if (file.size > maxSize) {
//       return NextResponse.json({ success: false, message: 'File too large. Maximum size is 5MB.' }, { status: 400 });
//     }

//     // Create unique filename
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = file.name.split('.').pop() || 'jpg';
//     const filename = `uploads/${uniqueSuffix}.${ext}`;

//     const blob = await put(filename, file, {
//       access: 'public',
//     });

//     return NextResponse.json({ success: true, url: blob.url });
//   } catch (error) {
//     console.error('Error saving file:', error);
//     return NextResponse.json({ success: false, message: 'Error saving file' }, { status: 500 });
//   }
// }
