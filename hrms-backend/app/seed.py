import uuid
import random
from datetime import date, datetime, timedelta
from passlib.context import CryptContext

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.employee import Department, SalaryGrade, Employee
from app.models.attendance import AttendanceLog, Shift
from app.models.leave import LeaveRequest, LeaveBalance
from app.models.payroll import PayrollRun, Payslip
from app.models.performance import PerformanceCycle, PerformanceReview, PerformanceGoal
from app.models.recruitment import JobPosting, Application
from app.models.notification import Notification
from app.models.audit import AuditLog

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def seed_data():
    db = SessionLocal()

    from sqlalchemy import text
    print("Cleaning up old data...")
    tables = [
        "audit_logs", "notifications", "applications", "job_postings", 
        "performance_reviews", "performance_goals", "review_cycles", "payslips", 
        "payroll_runs", "leave_balances", "leave_requests", "attendance_logs", 
        "shifts", "employees", "salary_grades", "departments", "users",
        "alembic_version"
    ]
    with engine.connect() as conn:
        for t in tables:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {t} CASCADE;"))
            except Exception as e:
                print(f"Error dropping {t}: {e}")
        conn.commit()
        
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)

    print("Seeding Users...")
    users_data = [
        {"email": "admin@hrmspro.com", "role": "ADMIN", "pw": "admin123"},
        {"email": "manager@hrmspro.com", "role": "SENIOR_MANAGER", "pw": "manager123"},
        {"email": "hr@hrmspro.com", "role": "HR_RECRUITER", "pw": "hr123"},
        {"email": "employee@hrmspro.com", "role": "EMPLOYEE", "pw": "employee123"},
    ]
    
    users = {}
    for ud in users_data:
        user = User(
            id=str(uuid.uuid4()),
            email=ud["email"],
            hashed_password=get_password_hash(ud["pw"]),
            role=ud["role"]
        )
        db.add(user)
        users[ud["role"]] = user
    db.commit()

    print("Seeding Salary Grades...")
    grades_data = [
        {"grade": "L1", "basic": 20000, "hra": 10000, "da": 5000, "allowances": 5000, "pf": 1800, "tax": 0},
        {"grade": "L2", "basic": 30000, "hra": 15000, "da": 7000, "allowances": 8000, "pf": 1800, "tax": 200},
        {"grade": "L3", "basic": 45000, "hra": 20000, "da": 10000, "allowances": 15000, "pf": 2500, "tax": 1500},
        {"grade": "L4", "basic": 70000, "hra": 30000, "da": 15000, "allowances": 20000, "pf": 4000, "tax": 5000},
        {"grade": "L5", "basic": 100000, "hra": 40000, "da": 20000, "allowances": 30000, "pf": 5000, "tax": 15000},
        {"grade": "L6", "basic": 150000, "hra": 60000, "da": 30000, "allowances": 50000, "pf": 7500, "tax": 30000},
    ]
    grades = {}
    for gd in grades_data:
        sg = SalaryGrade(
            id=str(uuid.uuid4()),
            grade=gd["grade"],
            basic_salary=gd["basic"],
            hra=gd["hra"],
            da=gd["da"],
            allowances=gd["allowances"],
            pf_rate=gd["pf"],
            tax_rate=gd["tax"]
        )
        db.add(sg)
        grades[gd["grade"]] = sg
    db.commit()

    print("Seeding Departments...")
    depts_data = ["Engineering", "Product", "Sales", "Marketing", "Human Resources", "Finance"]
    departments = {}
    for dname in depts_data:
        dept = Department(id=str(uuid.uuid4()), name=dname)
        db.add(dept)
        departments[dname] = dept
    db.commit()

    print("Seeding 50 Employees...")
    first_names = ["Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Saanvi", "Aadhya", "Kiara", "Diya", "Pihu", "Prisha", "Ananya", "Avni", "Kavya", "Myra", "Rohan", "Kabir", "Dhruv", "Rudra", "Aryan", "Atharva", "Rishi", "Vivaan", "Nikhil", "Rahul", "Neha", "Priya", "Riya", "Sneha", "Kriti", "Shruti", "Swati", "Tanya", "Megha", "Pooja"]
    last_names = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Das", "Bose", "Jain", "Agrawal", "Joshi", "Mishra", "Pandey", "Yadav", "Chauhan", "Rajput", "Kapoor", "Chopra"]
    
    employees = []
    # Create the 4 core users as employees
    core_users = [
        (users["ADMIN"], "Aarav", "Sharma", "Engineering", "L6", "CEO"),
        (users["SENIOR_MANAGER"], "Priya", "Singh", "Engineering", "L5", "VP Engineering"),
        (users["HR_RECRUITER"], "Neha", "Gupta", "Human Resources", "L4", "HR Lead"),
        (users["EMPLOYEE"], "Rahul", "Verma", "Engineering", "L2", "Software Engineer")
    ]
    
    for i, (usr, fn, ln, dept_name, grade, desig) in enumerate(core_users):
        emp = Employee(
            id=str(uuid.uuid4()),
            user_id=usr.id,
            employee_code=f"EMP{1000+i}",
            first_name=fn,
            last_name=ln,
            email=usr.email,
            department_id=departments[dept_name].id,
            salary_grade_id=grades[grade].id,
            designation=desig,
            joining_date=date(2022, 1, 15)
        )
        db.add(emp)
        employees.append(emp)

    # Create 46 random employees
    for i in range(46):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        dept = random.choice(list(departments.values()))
        grade = random.choice(list(grades.values()))
        
        emp = Employee(
            id=str(uuid.uuid4()),
            employee_code=f"EMP{1004+i}",
            first_name=fn,
            last_name=ln,
            email=f"{fn.lower()}.{ln.lower()}{i}@hrmspro.com",
            department_id=dept.id,
            salary_grade_id=grade.id,
            designation=f"{dept.name} Professional",
            joining_date=date(2023, random.randint(1,12), random.randint(1,28))
        )
        db.add(emp)
        employees.append(emp)
    
    db.commit()

    # Link back core users
    for i, (usr, _, _, _, _, _) in enumerate(core_users):
        usr.employee_id = employees[i].id
    db.commit()

    print("Setting Managers & Leave Balances...")
    ceo = employees[0]
    eng_mgr = employees[1]
    manager_emp = eng_mgr
    hr_mgr = employees[2]
    senior_dev_1 = employees[3]
    marketing_mgr = employees[4]
    finance_mgr = employees[5]
    senior_dev_2 = employees[6]
    junior_dev = employees[7]
    hr_recruiter = employees[8]

    eng_mgr.reporting_manager_id = ceo.id
    hr_mgr.reporting_manager_id = ceo.id
    marketing_mgr.reporting_manager_id = ceo.id
    finance_mgr.reporting_manager_id = ceo.id
    senior_dev_1.reporting_manager_id = eng_mgr.id
    senior_dev_2.reporting_manager_id = eng_mgr.id
    junior_dev.reporting_manager_id = senior_dev_1.id
    hr_recruiter.reporting_manager_id = hr_mgr.id

    managers = [marketing_mgr.id, finance_mgr.id, senior_dev_2.id, hr_mgr.id]
    for emp in employees[9:]:
        emp.reporting_manager_id = random.choice(managers)

    for emp in employees:
        
        # Leave Balance
        lb = LeaveBalance(
            id=str(uuid.uuid4()),
            employee_id=emp.id,
            casual_leave=12.0,
            sick_leave=12.0,
            earned_leave=15.0,
            year=2024
        )
        db.add(lb)
    db.commit()

    print("Seeding Attendance Logs for past 3 months...")
    today = date.today()
    start_date = today - timedelta(days=90)
    
    # Just seed attendance for a few employees to keep DB size reasonable
    sample_employees = employees[:5]
    
    for emp in sample_employees:
        curr_date = start_date
        while curr_date <= today:
            if curr_date.weekday() < 5: # Monday to Friday
                status = random.choices(["PRESENT", "ABSENT", "LATE", "HALF_DAY"], weights=[80, 5, 10, 5])[0]
                clock_in = datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=9, minutes=random.randint(0, 30))
                
                if status == "ABSENT":
                    al = AttendanceLog(employee_id=emp.id, date=curr_date, status="ABSENT")
                elif status == "HALF_DAY":
                    clock_out = clock_in + timedelta(hours=4)
                    al = AttendanceLog(employee_id=emp.id, date=curr_date, clock_in=clock_in, clock_out=clock_out, hours_worked=4.0, status="HALF_DAY")
                else:
                    clock_out = clock_in + timedelta(hours=random.randint(8, 9), minutes=random.randint(0, 59))
                    hw = (clock_out - clock_in).seconds / 3600.0
                    al = AttendanceLog(employee_id=emp.id, date=curr_date, clock_in=clock_in, clock_out=clock_out, hours_worked=hw, status=status)
                db.add(al)
            curr_date += timedelta(days=1)
    db.commit()

    print("Seeding 2 Payroll Runs with Payslips...")
    last_month = today.replace(day=1) - timedelta(days=1)
    two_months_ago = last_month.replace(day=1) - timedelta(days=1)
    
    for d in [two_months_ago, last_month]:
        pr = PayrollRun(
            id=str(uuid.uuid4()),
            month=d.month,
            year=d.year,
            run_date=d.replace(day=28),
            status="COMPLETED",
            total_employees=len(employees),
            run_by_id=users["HR_RECRUITER"].id
        )
        db.add(pr)
        db.commit()
        
        total_g = 0
        total_d = 0
        total_n = 0
        
        for emp in employees:
            sg = emp.salary_grade
            gross = sg.basic_salary + sg.hra + sg.da + sg.allowances
            deductions = sg.pf_rate + sg.tax_rate
            net = gross - deductions
            
            total_g += gross
            total_d += deductions
            total_n += net
            
            ps = Payslip(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                payroll_run_id=pr.id,
                month=d.month,
                year=d.year,
                basic_salary=sg.basic_salary,
                hra=sg.hra,
                da=sg.da,
                allowances=sg.allowances,
                gross_salary=gross,
                pf_deduction=sg.pf_rate,
                tax_deduction=sg.tax_rate,
                net_salary=net,
                working_days=22,
                present_days=random.randint(20, 22),
                status="SENT"
            )
            db.add(ps)
            
        pr.total_gross = total_g
        pr.total_deductions = total_d
        pr.total_net = total_n
        db.commit()

    print("Seeding Job Postings & Applications...")
    jobs_data = [
        {"title": "Senior Frontend Engineer", "dept": "Engineering"},
        {"title": "Backend Developer (Python)", "dept": "Engineering"},
        {"title": "Product Marketing Manager", "dept": "Marketing"},
        {"title": "HR Generalist", "dept": "Human Resources"},
        {"title": "Sales Executive", "dept": "Sales"},
    ]
    
    for jd in jobs_data:
        jp = JobPosting(
            id=str(uuid.uuid4()),
            title=jd["title"],
            department=jd["dept"],
            description="We are looking for an experienced professional to join our team...",
            requirements=["3+ years experience", "Strong communication skills"],
            location="Remote",
            salary_min=50000,
            salary_max=150000,
            posted_by_id=users["HR_RECRUITER"].id
        )
        db.add(jp)
        db.commit()
        
        # Add 3 applications per job
        for i in range(3):
            app = Application(
                id=str(uuid.uuid4()),
                job_posting_id=jp.id,
                candidate_name=f"Candidate {i} for {jd['title']}",
                candidate_email=f"candidate{i}@example.com",
                ai_score=random.uniform(50.0, 95.0),
                ai_summary="Strong candidate with relevant experience.",
                status=random.choice(["APPLIED", "SCREENING", "SHORTLISTED", "REJECTED"])
            )
            db.add(app)
    db.commit()

    print("Seeding Performance Review Cycle...")
    rc = PerformanceCycle(
        id=str(uuid.uuid4()),
        name="H1 2024 Performance Review",
        year=2024,
        start_date=date(2024, 6, 1),
        end_date=date(2024, 6, 30),
        status="ACTIVE"
    )
    db.add(rc)
    db.commit()

    for emp in sample_employees:
        pr = PerformanceReview(
            id=str(uuid.uuid4()),
            employee_id=emp.id,
            cycle_id=rc.id,
            reviewer_id=manager_emp.user_id,
            overall_rating=random.uniform(3.0, 5.0),
            status="SUBMITTED"
        )
        db.add(pr)
    db.commit()

    print("Seeding 15 AI Resignation Predictor Test Employees...")
    ai_test_emps = [
        # HIGH RISK
        {"fn": "Vikram", "ln": "Desai", "dept": "Engineering", "grade": "L3", "join": 3.5*365, "perf": 2.1, "leaves": 18, "att_rate": 0.71, "late": 0},
        {"fn": "Sneha", "ln": "Kapoor", "dept": "Marketing", "grade": "L2", "join": 1.5*365, "perf": 2.8, "leaves": 20, "att_rate": 0.68, "late": 8},
        {"fn": "Rohit", "ln": "Sharma", "dept": "Finance", "grade": "L3", "join": 4*365, "perf": 2.3, "leaves": 22, "att_rate": 0.85, "late": 0},
        {"fn": "Ananya", "ln": "Joshi", "dept": "Product", "grade": "L2", "join": 8*30, "perf": 1.9, "leaves": 5, "att_rate": 0.65, "late": 0},
        {"fn": "Karan", "ln": "Mehta", "dept": "Product", "grade": "L4", "join": 5*365, "perf": 4.2, "leaves": 14, "att_rate": 0.90, "late": 0},
        # MEDIUM RISK
        {"fn": "Aman", "ln": "Verma", "dept": "Engineering", "grade": "L2", "join": 2.5*365, "perf": 2.9, "leaves": 15, "att_rate": 0.82, "late": 3},
        {"fn": "Pooja", "ln": "Singh", "dept": "Sales", "grade": "L2", "join": 2.1*365, "perf": 3.1, "leaves": 14, "att_rate": 0.84, "late": 2},
        {"fn": "Rahul", "ln": "Das", "dept": "Marketing", "grade": "L3", "join": 3*365, "perf": 3.0, "leaves": 16, "att_rate": 0.81, "late": 4},
        {"fn": "Kavita", "ln": "Reddy", "dept": "Human Resources", "grade": "L2", "join": 2.8*365, "perf": 2.8, "leaves": 17, "att_rate": 0.83, "late": 2},
        {"fn": "Siddharth", "ln": "Bose", "dept": "Finance", "grade": "L3", "join": 2.2*365, "perf": 3.2, "leaves": 13, "att_rate": 0.85, "late": 1},
        # LOW RISK
        {"fn": "Meera", "ln": "Nair", "dept": "Engineering", "grade": "L4", "join": 1*365, "perf": 4.5, "leaves": 5, "att_rate": 0.95, "late": 0},
        {"fn": "Arjun", "ln": "Patel", "dept": "Product", "grade": "L3", "join": 0.5*365, "perf": 4.8, "leaves": 2, "att_rate": 0.98, "late": 0},
        {"fn": "Nisha", "ln": "Iyer", "dept": "Sales", "grade": "L2", "join": 1.2*365, "perf": 4.2, "leaves": 6, "att_rate": 0.96, "late": 0},
        {"fn": "Deepak", "ln": "Kumar", "dept": "Marketing", "grade": "L3", "join": 2*365, "perf": 4.6, "leaves": 8, "att_rate": 0.94, "late": 0},
        {"fn": "Riya", "ln": "Sen", "dept": "Finance", "grade": "L2", "join": 0.8*365, "perf": 4.3, "leaves": 4, "att_rate": 0.97, "late": 0},
    ]

    for i, emp_data in enumerate(ai_test_emps):
        # Create User
        email = f"{emp_data['fn'].lower()}.{emp_data['ln'].lower()}@hrmspro.com"
        usr = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=get_password_hash("password123"),
            role="EMPLOYEE"
        )
        db.add(usr)
        db.commit()
        
        # Determine joining date
        join_date = today - timedelta(days=int(emp_data['join']))
        
        # Create Employee
        emp = Employee(
            id=str(uuid.uuid4()),
            user_id=usr.id,
            employee_code=f"AIEMP{1000+i}",
            first_name=emp_data['fn'],
            last_name=emp_data['ln'],
            email=email,
            department_id=departments.get(emp_data['dept'], list(departments.values())[0]).id,
            salary_grade_id=grades.get(emp_data['grade'], list(grades.values())[0]).id,
            designation=f"Specialist",
            joining_date=join_date,
            reporting_manager_id=manager_emp.id,
            status="ACTIVE"
        )
        db.add(emp)
        db.commit()
        usr.employee_id = emp.id
        db.commit()
        
        # Performance Review
        pr = PerformanceReview(
            id=str(uuid.uuid4()),
            employee_id=emp.id,
            cycle_id=rc.id,
            reviewer_id=manager_emp.user_id,
            overall_rating=emp_data['perf'],
            status="SUBMITTED"
        )
        db.add(pr)
        
        # Leave Requests
        if emp_data['leaves'] > 0:
            lr = LeaveRequest(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                leave_type="CASUAL",
                start_date=today - timedelta(days=emp_data['leaves'] + 10),
                end_date=today - timedelta(days=10),
                days=emp_data['leaves'],
                reason="Personal time off",
                status="APPROVED"
            )
            db.add(lr)
            
            # Add short leaves pattern for Sneha (High Risk)
            if emp_data['fn'] == "Sneha":
                for _ in range(8):
                    lr_short = LeaveRequest(
                        id=str(uuid.uuid4()),
                        employee_id=emp.id,
                        leave_type="SICK",
                        start_date=today - timedelta(days=random.randint(5, 60)),
                        end_date=today - timedelta(days=random.randint(5, 60)),
                        days=1.0,
                        reason="Sick leave",
                        status="APPROVED"
                    )
                    db.add(lr_short)

        # Attendance (last 60 days)
        att_start = today - timedelta(days=60)
        curr = att_start
        lates_assigned = 0
        while curr <= today:
            if curr.weekday() < 5:
                # Randomly assign status based on att_rate
                is_present = random.random() < emp_data['att_rate']
                status = "PRESENT" if is_present else "ABSENT"
                
                # Force some lates if needed
                if is_present and lates_assigned < emp_data['late'] and curr > today - timedelta(days=30):
                    status = "LATE"
                    lates_assigned += 1
                
                clock_in = datetime.combine(curr, datetime.min.time()) + timedelta(hours=9)
                if status == "LATE":
                    clock_in += timedelta(minutes=random.randint(45, 120))
                
                clock_out = clock_in + timedelta(hours=8)
                
                al = AttendanceLog(
                    employee_id=emp.id,
                    date=curr,
                    clock_in=clock_in if status != "ABSENT" else None,
                    clock_out=clock_out if status != "ABSENT" else None,
                    hours_worked=8.0 if status != "ABSENT" else 0.0,
                    status=status
                )
                db.add(al)
            curr += timedelta(days=1)
            
        db.commit()

    print("Seeding Audit Logs...")
    # Generate some mock audit logs for the employees created
    for emp in employees[:15]:
        al_create = AuditLog(
            id=str(uuid.uuid4()),
            user_id=users["ADMIN"].id,
            action="CREATE_EMPLOYEE",
            entity="EMPLOYEE",
            entity_id=emp.id,
            new_values={"employee_code": emp.employee_code, "name": emp.first_name + " " + emp.last_name},
            ip_address="192.168.1.100",
            created_at=emp.joining_date
        )
        db.add(al_create)
        
        if random.random() > 0.5:
            al_update = AuditLog(
                id=str(uuid.uuid4()),
                user_id=users["HR_RECRUITER"].id,
                action="UPDATE_EMPLOYEE",
                entity="EMPLOYEE",
                entity_id=emp.id,
                old_values={"department_id": "old-dept"},
                new_values={"department_id": emp.department_id},
                ip_address="192.168.1.102",
                created_at=today - timedelta(days=random.randint(1, 30))
            )
            db.add(al_update)
            
    # Mock some logins
    for u in users.values():
        al_login = AuditLog(
            id=str(uuid.uuid4()),
            user_id=u.id,
            action="LOGIN_SUCCESS",
            entity="USER",
            entity_id=u.id,
            ip_address="10.0.0.15",
            created_at=today - timedelta(hours=random.randint(1, 48))
        )
        db.add(al_login)
    db.commit()

    print("✅ Seeding Complete! Enjoy HRMS Pro.")

if __name__ == "__main__":
    seed_data()
