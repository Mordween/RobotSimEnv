import swift
import roboticstoolbox as rtb
from math import pi
from spatialgeometry import Mesh, Axes
from spatialmath import SE3, Twist3
from spatialmath.base import *
from pydrake.solvers import MathematicalProgram, Solve
import numpy as np 
import time
import copy 
import os


class RobotControl():
    def __init__(self, dt, env, robot):
        self.dt = dt
        self.env = env
        self.robot = robot
        self.env.add(self.robot)


    def move(self, positionX, positionY, positionZ, numberOfSteps):

        Tep = sm.SE3.Trans(positionX, positionY, positionZ) * sm.SE3.OA([1, 0,1], [0, 0, -1])
        sol = self.robot.ik_LM(Tep)         # solve IK

        qt = rtb.jtraj(self.robot.q, sol[0], numberOfSteps)
        #print(qt.q[numberOfSteps-1])
        for steps in range(numberOfSteps):
            self.robot.q = qt.q[steps]
            self.env.step(self.dt)
            time.sleep(self.dt)
            
    
    def pause(self, second):
        for i in range(int(second/(self.dt))):
            self.env.step(self.dt)
            time.sleep(self.dt)


def jacobian_i_k_optimisation(robot, v, qd_max=1):

    # jacobian inverse kinematics with optimisation
    J = robot.jacobe(robot.q)
    prog = MathematicalProgram()
    qd_opt = prog.NewContinuousVariables(6, "v_opt")
    # Define the error term for the cost function
    error = J @ qd_opt - v
    prog.AddCost(error.dot(error))
    # Add bounding box constraint for joint velocities
    lower_bounds = [-qd_max] * 6  # Lower bounds for each joint velocity
    upper_bounds = [qd_max] * 6   # Upper bounds for each joint velocity
    prog.AddBoundingBoxConstraint(lower_bounds, upper_bounds, qd_opt)
    # Solve the optimization problem
    result = Solve(prog)
    return result.is_success(), result.GetSolution(qd_opt)


def robot_move_to(robot, simulation, dt, dest, gain=2, treshold=0.001, qd_max=1, move_brick=False): 
        arrived = False
        while not arrived:

            q = robot.q
            if move_brick:
                brick.T = SE3(robot.fkine(q).t)
            if isinstance(dest, SE3) or (isinstance(dest, np.ndarray) and dest.shape==(4,4)):
                v, arrived = rtb.cp_servo(robot.fkine(q), dest, gain=gain, threshold=treshold)
                qd = jacobian_i_k_optimisation(robot, v, qd_max=qd_max)[1]
            else:
                qd, arrived = rtb.jp_servo(q, dest, gain=gain, threshold=treshold)
            robot.qd = qd
            simulation.step(dt)

        return arrived, robot.q


def crane_move_to(T_dest, n_sample, shaftCenterD = 0.32):
    traj = rtb.ctraj(SE3(end_effector.T), T_dest, n_sample)
    
    for i in range(n_sample ):
        
        crane.T = SE3.Tx(traj[i].x)
        end_effector.T = SE3.Tx(traj[i].x)*SE3.Ty(traj[i].y)
        shaftLeft.T = SE3.Tx(traj[i].x)*SE3.Ty(traj[i].y)*SE3.Tz(3.785)
        shaftCenter.T = SE3.Tx(traj[i].x)*SE3.Ty(traj[i].y)*SE3.Tz(3.785)
        shaftRight.T = SE3.Tx(traj[i].x)*SE3.Ty(traj[i].y)*SE3.Tz(3.785)
        cube.T = SE3.Tx(traj[i].x)*SE3.Ty(traj[i].y+shaftCenterD)*SE3.Tz(SE3(cube.T).z)
        
        print("i : ", i)
        env.step(1/f)
        time.sleep(1/f)


def crane_pick_and_place(T_pick, T_place_up, T_place, n_sample):
    crane_move_to(T_pick, n_sample, 0.27)
    time.sleep(1)
    env._send_socket("shaft", ['add', [2, 3-0.27, 3.785], 0.001])
    env._send_socket("rope", 'add')
    time.sleep(5)  

    for i in range (70):
        cube.T = SE3(SE3(cube.T).x, SE3(cube.T).y-(1/1000), SE3(cube.T).z)
        env.step()

    for i in range(int((SE3(T_place_up).z-SE3(brick.T).z)*100)):
        cube.T = SE3(SE3(cube.T).x, SE3(cube.T).y, SE3(cube.T).z + (1/100))
        env.step()

    time.sleep(10)
    crane_move_to(T_place_up, n_sample, 0.2)    # 0.25 for cone

    # robot_move_to(lite6, env, 1/f, T_place_up*SE3.RPY([0, 0, -90], order='xyz', unit='deg'), gain=2, treshold=0.001, qd_max=1)
    # robot_move_to(lite6, env, 1/f, T_place*SE3.RPY([0, 0, -90], order='xyz', unit='deg'), gain=2, treshold=0.001, qd_max=1, move_brick=True)
    # robot_move_to(lite6, env, 1/f, lite6.qz, gain=2, treshold=0.001, qd_max=1)



if __name__ == "__main__":  # pragma nocover

    shaft_radius = 0.02
    brick_height = 0.03

    env = swift.Swift()
    env.launch(realtime=True)

    time.sleep(5)

    crane = Mesh(
        filename=str(f"{os.path.expanduser('~')}/Documents/swiftRepare/tests/urdf-object/crane_body.glb"),
        color=[34, 143, 201],
        scale=(0.01,) * 3,
    )

    end_effector = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/end_effector.glb"),
        color=[31, 184, 72],
        scale=(0.01,) * 3,
    )

    shaftLeft = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/shaftPart/shaftLeft.glb"),
        color=[31, 184, 72],
        scale=(0.01,) * 3,
    )
    shaftCenter = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/shaftPart/shaftCenter.glb"),
        color=[31, 184, 72],
        scale=(0.01,) * 3,
    )

    shaftRight = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/shaftPart/shaftRight.glb"),
        color=[31, 184, 72],
        scale=(0.01,) * 3,
    )

    rails= Mesh(    
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/rails.glb"),
        color=[240, 103, 103],
        scale=(0.01,) * 3,
    )
    brick = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/brick.glb"),
        color=[50, 50, 50],
        scale=(0.01,) * 3,
    )
    cube = Mesh(
        filename=("/home/fari/Documents/swiftRepare/tests/urdf-object/cube.glb"),
        color=[50, 50, 50],
        scale=(0.01,) * 3,
    )

    shaftLeft.T = SE3(0, 0, 3.785)
    shaftCenter.T = SE3(0, 0, 3.785)
    shaftRight.T = SE3(0, 0, 3.785)

    cube.T = SE3(0, 0+0.27, 3.785+0.5)


    brick.T = SE3(2, 3, 0.16)

    lite6 = rtb.models.Lite6()
    lite6.base = SE3(0.4, 0, 0.0)*SE3.Rz(pi/2)
    print(dir(lite6))

    env.add(crane, collision_enable = False)
    env.add(brick, collision_enable = True, collisionFlags = 0, mass = 0.5)

    env.add(shaftLeft, collision_enable = True, mass = 100)
    env.add(shaftCenter, collision_enable = True, mass = 100)
    env.add(shaftRight, collision_enable = True, mass = 100)

    env.add(rails, collision_enable = False)
    # env.add(lite6, collision_enable = False)
    env.add(cube, collision_enable = True) 

    time.sleep(5)

    end_effector.T = SE3(0, 0, 0.0)
    crane.T = SE3(0, 0, 0.)
    f=50

    T_pick = SE3(2, 3-0.27, 0.3)

    T_place_up = SE3(0.0, 2, 2)
    T_place = SE3(0, 2, 0.9)

    crane_pick_and_place(T_pick, T_place_up, T_place, 400)

    time.sleep(100)
    env.hold()

