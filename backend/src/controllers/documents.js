import prisma from "../utils/prisma.js";

export async function listDocuments(req, res, next) {
  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

export async function createDocument(req, res, next) {
  try {
    const { type, description } = req.body;
    if (!type) {
      return res.status(400).json({ error: "type is required" });
    }
    const doc = await prisma.document.create({
      data: { userId: req.user.id, type, description },
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Document not found" });
    }
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(doc);
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const existing = await prisma.document.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Document not found" });
    }
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: "Document deleted" });
  } catch (err) {
    next(err);
  }
}
