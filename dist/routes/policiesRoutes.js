"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const policiesController_1 = require("../controllers/policiesController");
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            const error = new Error('Only PDF files are allowed');
            error.statusCode = 400;
            return cb(error);
        }
        return cb(null, true);
    },
});
const router = express_1.default.Router();
router.post('/upload', upload.array('files'), policiesController_1.uploadPolicies);
router.post('/save', policiesController_1.savePolicy);
router.get('/', policiesController_1.getPolicies);
router.get('/export/csv', policiesController_1.exportPoliciesCsv);
router.put('/:id', policiesController_1.updatePolicy);
router.delete('/:id', policiesController_1.deletePolicy);
exports.default = router;
//# sourceMappingURL=policiesRoutes.js.map