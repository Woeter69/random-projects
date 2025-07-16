import mysql.connector as con
from datetime import datetime, timedelta
import bcrypt
from tabulate import tabulate

mydb=con.connect(host="localhost",user="root",password="stillalive")
cur=mydb.cursor()

cur.execute("USE TODOLIST")

def user_reg():
    name=input("Enter your Name ")
    email=input("Enter your Email ")
    passwd=input("Enter Password ")
    
    pass_byte=passwd.encode('utf-8')
    salt=bcrypt.gensalt()
    hashed_passwd=bcrypt.hashpw(pass_byte,salt)

    user_id=input("Enter Username ")
    created_at=datetime.now()

    query=("INSERT INTO Users (user_id,name,email,password_hash,created_at) VALUES(%s,%s,%s,%s,%s)")
    values=(user_id,name,email,hashed_passwd,created_at)
    
    cur.execute(query,values)
    mydb.commit()




def add_task(user_id):
    try:
        task_name=input("Enter Task ")
        priority=input("Whats the priority of the task?/nOnly use 'Low''Medium''High' ")
        created_at=datetime.now()
        due_at=created_at+timedelta(days=1)
    
        query=("INSERT INTO Tasks (user_id,task_name,priority,created_at,due_at) VALUES(%s,%s,%s,%s,%s)")
        values=(user_id,task_name,priority,created_at,due_at)

        cur.execute(query,values)


        print("Task Added Successfully")
    except Exception:
        print("Error Cannot Add Task")
    
    mydb.commit()

def submit_task(user_id):
    try:
        cur.execute("SELECT user_id,task_id,task_name,status,due_at from TASKS")
        all_tasks=cur.fetchall()
        print(tabulate(all_tasks,headers=["User_Id","Task_Id","Task", "Status", "Due"]))

        com_task=input("Which task you want to mark completed?(Enter Task_Id) ")
        query="UPDATE TASKS SET status='completed' where task_id=%s"

        values=(com_task,)

        cur.execute(query,values)

        query="INSERT INTO POINTS (user_id,task_id,points,reason,created_at) VALUES (%s,%s,%s,%s,%s)"
        values=(user_id,com_task,+10,"Completion",datetime.now())

        cur.execute(query,values)


        print("Task Completed Successfully")
    except Exception:
        print("Error Cannot Complete Task")

    mydb.commit()


def failed_task(user_id):
    try:
        cur.execute("SELECT task_id from TASKS where status='pending' and due_at < NOW()")
        fail_task=cur.fetchall()
        for task_id in fail_task:
            cur.execute("UPDATE TASKS SET status='failed' WHERE task_id=%s", (task_id,))
            query="INSERT INTO POINTS (user_id,task_id,points,reason,created_at) VALUES (%s,%s,%s,%s,%s)"
            values=(user_id,task_id,-5,"Failure",datetime.now())
            cur.execute(query, values)
        
    except Exception:
        print("Error")

    
        mydb.commit()


def point_check(user_id):
    try:
        cur.execute("SELECT user_id,points,reason FROM POINTS where user_id = %s",(user_id,))
        point=cur.fetchall()

        cur.execute("SELECT sum(points) FROM POINTS")
        total_points=cur.fetchone()

        print(tabulate(point,headers=["Username","Points","Reason"],))

        print("Your Total Points Are",total_points[0])
    
    except Exception:
        print("Error Cannot Display Points Right Now")
    
 

    mydb.commit()
    

while True:
    print("1:Register")
    print("2:Login")
    print("3:Exit Main Menu") 
    choice=int(input("Enter your Choice "))
    if choice==1:
        user_reg()
    if choice==2:
        global user
        user=input("Enter your Username ")
        passwd=input("Enter Password ")
        cur.execute("SELECT password_hash from USERS where user_id=%s",(user,))
        result=cur.fetchone()

        mydb.commit()

        if result:
            stored_hash=result[0].encode("utf-8")
            if bcrypt.checkpw(passwd.encode("utf-8"),stored_hash):
                print("Login Successful...")
                failed_task(user)

                while True:
                    print("1:Add Task")
                    print("2:Mark Task Complete")
                    print("3:Check Points")
                    print("4:To Exit The Task Menu")
                    
                    c=int(input("Enter your Choice "))
                    if c==1:
                        add_task(user)
                    elif c==2:
                        submit_task(user)
                    elif c==3:
                        point_check(user)
                    elif c==4:
                        break
                    

            else:
                print("Wrong Password or User_ID")
        else:
            print("User not Found")
    if choice==3:
        break


        

        

    
    
    

    


    