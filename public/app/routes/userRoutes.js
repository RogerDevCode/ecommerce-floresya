import { Router } from 'express';
import { userController, userValidators } from '../../controllers/UserController.js';
export function createUserRoutes() {
    const router = Router();
    router.get('/', userValidators.getAllUsers, userController.getAllUsers.bind(userController));
    router.get('/:id', userValidators.getUserById, userController.getUserById.bind(userController));
    router.post('/', userValidators.createUser, userController.createUser.bind(userController));
    router.put('/:id', userValidators.updateUser, userController.updateUser.bind(userController));
    router.patch('/:id/toggle-active', userValidators.toggleUserActive, userController.toggleUserActive.bind(userController));
    router.delete('/:id', userValidators.deleteUser, userController.deleteUser.bind(userController));
    router.post('/test-create', (req, res) => {
        res.json({ message: 'Test endpoint works', body: req.body });
    });
    router.delete('/test-delete/:id', (req, res) => {
        const id = req.params.id;
        res.json({ message: `Test delete for user ${id} works` });
    });
    router.get('/ping', (req, res) => {
        res.json({ message: 'Pong! Server is working', timestamp: new Date().toISOString() });
    });
    return router;
}
