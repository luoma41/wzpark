module.exports = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '5.0',
      totalDbFiles: 0,
      totalCosFiles: 0,
      orphansFound: 0,
      orphanKeys: [],
      deleted: 0,
      message: 'COS cleanup temporarily disabled. Please clean orphan files manually from Tencent Cloud console.'
    }
  });
};
